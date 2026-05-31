import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { readFileSync } from 'node:fs';
import { rm } from 'node:fs/promises';

import { ApiModule } from '../../src/api.module';
import { clearAuthRateLimitBuckets } from '../../src/adapters/inbound/http/auth-rate-limit.guard';
import {
  HttpRequestLoggingMiddleware,
  type HttpLoggingRequest,
  type HttpLoggingResponse,
  type HttpRequestLogEntry,
} from '../../src/adapters/inbound/http/http-request-logging';
import { PostgresPool } from '../../src/adapters/outbound/postgres/postgres-pool';
import type { LlmProviderPort, LlmProviderRequest, LlmProviderResponse } from '../../src/application/ports/llm-provider.port';
import { LLM_PROVIDER, ProcessRecognitionTaskUseCase } from '../../src/application/use-cases/process-recognition-task.use-case';
import { ApiConfigService } from '../../src/infrastructure/config/api-config';
import { loadApiLoggingConfig } from '../../src/infrastructure/config/api-logging-config';
import { pngBytes } from '../../src/test-support/image-bytes';

describe('mobile API integration flow', () => {
  let fixture: MobileApiFixture;

  beforeAll(async () => {
    fixture = await createMobileApiFixture();
  });

  beforeEach(async () => {
    clearAuthRateLimitBuckets();
    fixture.requestLogs.length = 0;
    fixture.llmProvider.calls.length = 0;
    await resetDatabase(fixture.pool);
    await resetImageDirectory(fixture.apiConfig.load().measurementImageDirectory);
  });

  afterAll(async () => {
    await fixture.app.close();
    await fixture.pool.close();
  });

  describe('POST /api/v1/signin - happy path', () => {
    async function response(): Promise<FetchJsonResponse> {
      return signIn(fixture, 'demo@example.com');
    }

    it('responds with HTTP 201', async () => {
      expect((await response()).status).toBe(201);
    });

    it('responds with proper json', async () => {
      expect((await response()).body).toEqual({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresAt: expect.any(String),
        user: { id: expect.stringMatching(/^usr_/), email: 'demo@example.com' },
      });
    });

    it('creates a user in PostgreSQL', async () => {
      await response();

      expect(await countRows(fixture.pool, 'user_accounts')).toBe(1);
    });

    it('creates a bearer token in PostgreSQL', async () => {
      await response();

      expect(await countRows(fixture.pool, 'bearer_tokens')).toBe(1);
    });
  });

  describe('POST /api/v1/signin - invalid email', () => {
    async function response(): Promise<FetchJsonResponse> {
      return postJson(fixture.baseUrl, '/api/v1/signin', {
        email: 'not-an-email',
        password: 'password123',
      });
    }

    it('responds with HTTP 400', async () => {
      expect((await response()).status).toBe(400);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'validation_error');
    });
  });

  describe('POST /api/v1/signin - email already taken', () => {
    async function response(): Promise<FetchJsonResponse> {
      await signIn(fixture, 'duplicate@example.com');

      return signIn(fixture, 'duplicate@example.com');
    }

    it('responds with HTTP 409', async () => {
      expect((await response()).status).toBe(409);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'conflict', 'Email is already registered');
    });
  });

  describe('POST /api/v1/signin - rate limited', () => {
    async function response(): Promise<FetchJsonResponse> {
      const body = { email: 'limited-signin@example.com', password: 'short' };
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await postJson(fixture.baseUrl, '/api/v1/signin', body);
      }

      return postJson(fixture.baseUrl, '/api/v1/signin', body);
    }

    it('responds with HTTP 429', async () => {
      expect((await response()).status).toBe(429);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'rate_limited', 'Too many authentication attempts; try again later');
    });
  });

  describe('POST /api/v1/login - happy path', () => {
    async function response(): Promise<FetchJsonResponse> {
      await signIn(fixture, 'login@example.com');

      return login(fixture, 'login@example.com');
    }

    it('responds with HTTP 201', async () => {
      expect((await response()).status).toBe(201);
    });

    it('responds with proper json', async () => {
      expect((await response()).body).toEqual({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresAt: expect.any(String),
        user: { id: expect.stringMatching(/^usr_/), email: 'login@example.com' },
      });
    });

    it('creates a bearer token in PostgreSQL', async () => {
      await response();

      expect(await countRows(fixture.pool, 'bearer_tokens')).toBe(2);
    });
  });

  describe('POST /api/v1/login - invalid email', () => {
    async function response(): Promise<FetchJsonResponse> {
      return postJson(fixture.baseUrl, '/api/v1/login', {
        email: 'invalid',
        password: 'password123',
      });
    }

    it('responds with HTTP 400', async () => {
      expect((await response()).status).toBe(400);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'validation_error');
    });
  });

  describe('POST /api/v1/login - invalid credentials', () => {
    async function response(): Promise<FetchJsonResponse> {
      await signIn(fixture, 'auth@example.com');

      return postJson(fixture.baseUrl, '/api/v1/login', {
        email: 'auth@example.com',
        password: 'wrong-password',
      });
    }

    it('responds with HTTP 401', async () => {
      expect((await response()).status).toBe(401);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'unauthorized', 'Invalid email or password');
    });
  });

  describe('POST /api/v1/login - rate limited', () => {
    async function response(): Promise<FetchJsonResponse> {
      const body = { email: 'limited-login@example.com', password: 'wrong-password' };
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await postJson(fixture.baseUrl, '/api/v1/login', body);
      }

      return postJson(fixture.baseUrl, '/api/v1/login', body);
    }

    it('responds with HTTP 429', async () => {
      expect((await response()).status).toBe(429);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'rate_limited', 'Too many authentication attempts; try again later');
    });
  });

  describe('GET /api/v1/measurements - happy path empty history', () => {
    async function response(): Promise<FetchJsonResponse> {
      const accessToken = await signedInAccessToken(fixture);

      return getJson(fixture.baseUrl, '/api/v1/measurements', accessToken);
    }

    it('responds with HTTP 200', async () => {
      expect((await response()).status).toBe(200);
    });

    it('responds with proper json', async () => {
      expect((await response()).body).toEqual({
        items: [],
        page: 1,
        pageSize: 20,
        hasNextPage: false,
        filters: { from: null, to: null },
      });
    });

    it('keeps measurements empty in PostgreSQL', async () => {
      await response();

      expect(await countRows(fixture.pool, 'measurements')).toBe(0);
    });
  });

  describe('GET /api/v1/measurements - invalid bearer token', () => {
    async function response(): Promise<FetchJsonResponse> {
      return getJson(fixture.baseUrl, '/api/v1/measurements', 'invalid-token');
    }

    it('responds with HTTP 401', async () => {
      expect((await response()).status).toBe(401);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'unauthorized', 'Bearer token is invalid or expired');
    });
  });

  describe('GET /api/v1/measurements - invalid date range', () => {
    async function response(): Promise<FetchJsonResponse> {
      const accessToken = await signedInAccessToken(fixture);

      return getJson(
        fixture.baseUrl,
        '/api/v1/measurements?from=2026-05-31T00:00:00.000Z&to=2026-05-01T00:00:00.000Z',
        accessToken,
      );
    }

    it('responds with HTTP 400', async () => {
      expect((await response()).status).toBe(400);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'validation_error');
    });
  });

  describe('POST /api/v1/measurements - happy path', () => {
    async function upload(): Promise<UploadMeasurementScenario> {
      const accessToken = await signedInAccessToken(fixture);
      const response = await uploadMeasurement(fixture, accessToken);
      const measurementId = readString(response.body.id, 'measurement id');

      return { response, measurementId };
    }

    it('responds with HTTP 201', async () => {
      expect((await upload()).response.status).toBe(201);
    });

    it('responds with proper json', async () => {
      expect((await upload()).response.body).toEqual({
        id: expect.stringMatching(/^msr_/),
        status: 'pending',
        measurementTime: expect.any(String),
      });
    });

    it('persists the measurement in PostgreSQL', async () => {
      const { measurementId } = await upload();

      expect(await countRows(fixture.pool, 'measurements')).toBe(1);
      expect(await measurementStatus(fixture.pool, measurementId)).toBe('pending');
    });

    it('stores the image on disk', async () => {
      await upload();

      expect(await countRows(fixture.pool, 'measurement_images')).toBe(1);
    });

    it('queues a recognition task in PostgreSQL', async () => {
      await upload();

      expect(await countRows(fixture.pool, 'recognition_tasks')).toBe(1);
    });

    it('does not call OpenAI during upload', async () => {
      await upload();

      expect(fixture.llmProvider.calls).toHaveLength(0);
    });
  });

  describe('POST /api/v1/measurements - missing image', () => {
    async function response(): Promise<FetchJsonResponse> {
      const accessToken = await signedInAccessToken(fixture);

      return postForm(fixture.baseUrl, '/api/v1/measurements', accessToken, new FormData());
    }

    it('responds with HTTP 400', async () => {
      expect((await response()).status).toBe(400);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'validation_error', 'image is required');
    });
  });

  describe('POST /api/v1/measurements - missing bearer token', () => {
    async function response(): Promise<FetchJsonResponse> {
      return postForm(fixture.baseUrl, '/api/v1/measurements', undefined, measurementForm());
    }

    it('responds with HTTP 401', async () => {
      expect((await response()).status).toBe(401);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'unauthorized', 'Bearer token is required');
    });
  });

  describe('GET /api/v1/measurements/{id} - happy path recognized measurement', () => {
    async function response(): Promise<MeasurementResponseScenario> {
      const accessToken = await signedInAccessToken(fixture);
      const measurementId = await uploadAndRecognize(fixture, accessToken);
      const response = await getJson(fixture.baseUrl, `/api/v1/measurements/${measurementId}`, accessToken);

      return { response, measurementId };
    }

    it('responds with HTTP 200', async () => {
      expect((await response()).response.status).toBe(200);
    });

    it('responds with proper json', async () => {
      const { response: measurementResponse, measurementId } = await response();

      expect(measurementResponse.body).toEqual({
        id: measurementId,
        status: 'recognized',
        systolic: 122,
        diastolic: 82,
        pulse: 70,
        armSide: 'right',
        measurementTime: expect.any(String),
        imageUrl: `/api/v1/measurements/${measurementId}/image`,
      });
    });

    it('calls OpenAI through the mocked port', async () => {
      await response();

      expect(fixture.llmProvider.calls).toHaveLength(1);
    });
  });

  describe('GET /api/v1/measurements/{id} - missing bearer token', () => {
    async function response(): Promise<FetchJsonResponse> {
      return getJson(fixture.baseUrl, '/api/v1/measurements/msr_missing');
    }

    it('responds with HTTP 401', async () => {
      expect((await response()).status).toBe(401);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'unauthorized', 'Bearer token is required');
    });
  });

  describe('GET /api/v1/measurements/{id} - measurement not found', () => {
    async function response(): Promise<FetchJsonResponse> {
      const accessToken = await signedInAccessToken(fixture);

      return getJson(fixture.baseUrl, '/api/v1/measurements/msr_missing', accessToken);
    }

    it('responds with HTTP 404', async () => {
      expect((await response()).status).toBe(404);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'not_found', 'Measurement was not found');
    });
  });

  describe('GET /api/v1/measurements/{id}/image - happy path', () => {
    async function response(): Promise<Response> {
      const accessToken = await signedInAccessToken(fixture);
      const uploadResponse = await uploadMeasurement(fixture, accessToken);
      const measurementId = readString(uploadResponse.body.id, 'measurement id');

      return getRaw(fixture.baseUrl, `/api/v1/measurements/${measurementId}/image`, accessToken);
    }

    it('responds with HTTP 200', async () => {
      expect((await response()).status).toBe(200);
    });

    it('responds with binary image data', async () => {
      const imageResponse = await response();

      expect(imageResponse.headers.get('content-type')).toContain('image/png');
      expect((await imageResponse.arrayBuffer()).byteLength).toBe(pngBytes.byteLength);
    });

    it('returns stored image bytes from the filesystem adapter', async () => {
      expect((await (await response()).arrayBuffer()).byteLength).toBe(pngBytes.byteLength);
    });
  });

  describe('GET /api/v1/measurements/{id}/image - missing bearer token', () => {
    async function response(): Promise<FetchJsonResponse> {
      return getJson(fixture.baseUrl, '/api/v1/measurements/msr_missing/image');
    }

    it('responds with HTTP 401', async () => {
      expect((await response()).status).toBe(401);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'unauthorized', 'Bearer token is required');
    });
  });

  describe('GET /api/v1/measurements/{id}/image - measurement not found', () => {
    async function response(): Promise<FetchJsonResponse> {
      const accessToken = await signedInAccessToken(fixture);

      return getJson(fixture.baseUrl, '/api/v1/measurements/msr_missing/image', accessToken);
    }

    it('responds with HTTP 404', async () => {
      expect((await response()).status).toBe(404);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'not_found', 'Measurement was not found');
    });
  });

  describe('POST /api/v1/measurements/{id}/save - happy path', () => {
    async function response(): Promise<MeasurementResponseScenario> {
      const accessToken = await signedInAccessToken(fixture);
      const measurementId = await uploadAndRecognize(fixture, accessToken);
      const response = await postJson(fixture.baseUrl, `/api/v1/measurements/${measurementId}/save`, {}, accessToken);

      return { response, measurementId };
    }

    it('responds with HTTP 201', async () => {
      expect((await response()).response.status).toBe(201);
    });

    it('responds with proper json', async () => {
      const { response: saveResponse, measurementId } = await response();

      expect(saveResponse.body).toEqual({
        id: measurementId,
        status: 'saved',
        systolic: 122,
        diastolic: 82,
        pulse: 70,
        armSide: 'right',
        measurementTime: expect.any(String),
        savedAt: expect.any(String),
      });
    });

    it('persists the saved status in PostgreSQL', async () => {
      const { measurementId } = await response();

      expect(await measurementStatus(fixture.pool, measurementId)).toBe('saved');
    });
  });

  describe('POST /api/v1/measurements/{id}/save - missing bearer token', () => {
    async function response(): Promise<FetchJsonResponse> {
      return postJson(fixture.baseUrl, '/api/v1/measurements/msr_missing/save', {});
    }

    it('responds with HTTP 401', async () => {
      expect((await response()).status).toBe(401);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'unauthorized', 'Bearer token is required');
    });
  });

  describe('POST /api/v1/measurements/{id}/save - measurement not found', () => {
    async function response(): Promise<FetchJsonResponse> {
      const accessToken = await signedInAccessToken(fixture);

      return postJson(fixture.baseUrl, '/api/v1/measurements/msr_missing/save', {}, accessToken);
    }

    it('responds with HTTP 404', async () => {
      expect((await response()).status).toBe(404);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'not_found', 'Measurement was not found');
    });
  });

  describe('POST /api/v1/measurements/{id}/save - pending measurement conflict', () => {
    async function response(): Promise<FetchJsonResponse> {
      const accessToken = await signedInAccessToken(fixture);
      const upload = await uploadMeasurement(fixture, accessToken);
      const measurementId = readString(upload.body.id, 'measurement id');

      return postJson(fixture.baseUrl, `/api/v1/measurements/${measurementId}/save`, {}, accessToken);
    }

    it('responds with HTTP 409', async () => {
      expect((await response()).status).toBe(409);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'conflict', 'Measurement must be recognized before it can be saved');
    });
  });

  describe('GET /api/v1/measurements - happy path saved and recognized history', () => {
    async function response(): Promise<MeasurementResponseScenario> {
      const accessToken = await signedInAccessToken(fixture);
      const recognizedMeasurementId = await uploadAndRecognize(fixture, accessToken);
      const savedMeasurementId = await uploadAndRecognize(fixture, accessToken);
      await postJson(fixture.baseUrl, `/api/v1/measurements/${savedMeasurementId}/save`, {}, accessToken);
      const response = await getJson(fixture.baseUrl, '/api/v1/measurements', accessToken);

      return { response, recognizedMeasurementId, savedMeasurementId };
    }

    it('responds with HTTP 200', async () => {
      expect((await response()).response.status).toBe(200);
    });

    it('responds with proper json', async () => {
      const { response: historyResponse, recognizedMeasurementId, savedMeasurementId } = await response();

      expect(historyResponse.body).toEqual({
        items: [
          {
            id: savedMeasurementId,
            status: 'saved',
            systolic: 122,
            diastolic: 82,
            pulse: 70,
            armSide: 'right',
            measurementTime: expect.any(String),
            savedAt: expect.any(String),
          },
          {
            id: recognizedMeasurementId,
            status: 'recognized',
            systolic: 122,
            diastolic: 82,
            pulse: 70,
            armSide: 'right',
            measurementTime: expect.any(String),
            savedAt: null,
          },
        ],
        page: 1,
        pageSize: 20,
        hasNextPage: false,
        filters: { from: null, to: null },
      });
    });

    it('omits image bytes from the response', async () => {
      expect(JSON.stringify((await response()).response.body)).not.toContain('image/png');
    });
  });

  describe('GET /api/v1/measurements - debug logging', () => {
    async function requestHistoryWithLogs(): Promise<string> {
      const accessToken = await signedInAccessToken(fixture);
      const measurementId = await uploadAndRecognize(fixture, accessToken);
      await getJson(fixture.baseUrl, `/api/v1/measurements/${measurementId}`, accessToken);
      await postJson(fixture.baseUrl, `/api/v1/measurements/${measurementId}/save`, {}, accessToken);

      return measurementId;
    }

    async function response(): Promise<FetchJsonResponse> {
      await requestHistoryWithLogs();

      return getJson(fixture.baseUrl, '/api/v1/measurements', 'very-secret-token');
    }

    it('responds with HTTP 401', async () => {
      expect((await response()).status).toBe(401);
    });

    it('responds with proper json', async () => {
      expectErrorBody(await response(), 'unauthorized', 'Bearer token is invalid or expired');
    });

    it('logs request status metadata', async () => {
      const measurementId = await requestHistoryWithLogs();
      await getJson(fixture.baseUrl, '/api/v1/measurements', 'very-secret-token');

      expect(findLog(fixture.requestLogs, 'POST', '/api/v1/signin')?.statusCode).toBe(201);
      expect(findLog(fixture.requestLogs, 'POST', '/api/v1/measurements')?.statusCode).toBe(201);
      expect(findLog(fixture.requestLogs, 'GET', `/api/v1/measurements/${measurementId}`)?.statusCode).toBe(200);
      expect(findLog(fixture.requestLogs, 'POST', `/api/v1/measurements/${measurementId}/save`)?.statusCode).toBe(201);
      expect(findLog(fixture.requestLogs, 'GET', '/api/v1/measurements')?.statusCode).toBe(401);
    });

    it('logs request metadata without credentials, tokens, payloads, image bytes, or readings', async () => {
      await response();

      expect(JSON.stringify(fixture.requestLogs)).not.toMatch(/password123|very-secret-token|Authorization|Bearer|png|systolic|diastolic|pulse/);
    });
  });
});

type MobileApiFixture = {
  app: INestApplication;
  baseUrl: string;
  pool: PostgresPool;
  processor: ProcessRecognitionTaskUseCase;
  llmProvider: MockLlmProvider;
  apiConfig: ApiConfigService;
  requestLogs: HttpRequestLogEntry[];
};

type FetchJsonResponse = {
  status: number;
  body: Record<string, unknown>;
};

type UploadMeasurementScenario = {
  response: FetchJsonResponse;
  measurementId: string;
};

type MeasurementResponseScenario = {
  response: FetchJsonResponse;
  measurementId: string;
};

type CountRow = {
  count: string;
};

type StatusRow = {
  status: string;
};

type TaskRow = {
  id: string;
};

class MockLlmProvider implements LlmProviderPort {
  readonly provider = 'openai';
  readonly calls: LlmProviderRequest[] = [];

  async infer(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    this.calls.push(request);

    return {
      hand: 'right',
      systolic: 122,
      diastolic: 82,
      pulse: 70,
      confidence: 0.99,
      uncertainFields: [],
      rawNotes: 'integration test fixture',
    };
  }
}

async function createMobileApiFixture(): Promise<MobileApiFixture> {
  loadTestEnv();
  clearAuthRateLimitBuckets();
  const requestLogs: HttpRequestLogEntry[] = [];
  const llmProvider = new MockLlmProvider();
  const moduleRef = await Test.createTestingModule({ imports: [ApiModule] })
    .overrideProvider(LLM_PROVIDER)
    .useValue(llmProvider)
    .compile();
  const app = moduleRef.createNestApplication({ logger: false });
  const logging = loadApiLoggingConfig(process.env);
  if (logging.debugHttpRequests) {
    const requestLogging = HttpRequestLoggingMiddleware.withLogger({
      debug: (message: string): void => {
        requestLogs.push(JSON.parse(message) as HttpRequestLogEntry);
      },
    });
    app.use((request: HttpLoggingRequest, response: HttpLoggingResponse, next: () => void) => {
      requestLogging.use(request, response, next);
    });
  }

  await app.listen(0);

  return {
    app,
    baseUrl: await app.getUrl(),
    pool: app.get(PostgresPool),
    processor: app.get(ProcessRecognitionTaskUseCase),
    llmProvider,
    apiConfig: app.get(ApiConfigService),
    requestLogs,
  };
}

function loadTestEnv(): void {
  const envFile = readFileSync('.env.test', 'utf8');
  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator);
    if (process.env[key] === undefined) {
      process.env[key] = trimmed.slice(separator + 1);
    }
  }
}

async function resetDatabase(pool: PostgresPool): Promise<void> {
  await pool.query('TRUNCATE recognition_tasks, measurement_images, measurements, bearer_tokens, user_accounts RESTART IDENTITY CASCADE');
}

async function resetImageDirectory(directory: string): Promise<void> {
  await rm(directory, { recursive: true, force: true });
}

async function signIn(fixture: MobileApiFixture, email: string): Promise<FetchJsonResponse> {
  return postJson(fixture.baseUrl, '/api/v1/signin', { email, password: 'password123' });
}

async function login(fixture: MobileApiFixture, email: string): Promise<FetchJsonResponse> {
  return postJson(fixture.baseUrl, '/api/v1/login', { email, password: 'password123' });
}

async function signedInAccessToken(fixture: MobileApiFixture): Promise<string> {
  const response = await signIn(fixture, 'demo@example.com');

  return readString(response.body.accessToken, 'access token');
}

async function uploadMeasurement(fixture: MobileApiFixture, accessToken: string): Promise<FetchJsonResponse> {
  return postForm(fixture.baseUrl, '/api/v1/measurements', accessToken, measurementForm());
}

async function uploadAndRecognize(fixture: MobileApiFixture, accessToken: string): Promise<string> {
  const response = await uploadMeasurement(fixture, accessToken);
  const measurementId = readString(response.body.id, 'measurement id');
  const taskId = await queuedTaskId(fixture.pool, measurementId);
  await fixture.processor.execute({ taskId, model: readRequiredEnv('CLI_MODEL') });

  return measurementId;
}

function measurementForm(): FormData {
  const form = new FormData();
  form.append('image', new Blob([pngBytes], { type: 'image/png' }), 'bp.png');

  return form;
}

async function postJson(
  baseUrl: string,
  pathname: string,
  body: unknown,
  accessToken?: string,
): Promise<FetchJsonResponse> {
  return parseJsonResponse(
    await fetch(`${baseUrl}${pathname}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

async function postForm(
  baseUrl: string,
  pathname: string,
  accessToken: string | undefined,
  form: FormData,
): Promise<FetchJsonResponse> {
  return parseJsonResponse(
    await fetch(`${baseUrl}${pathname}`, {
      method: 'POST',
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      body: form,
    }),
  );
}

async function getJson(baseUrl: string, pathname: string, accessToken?: string): Promise<FetchJsonResponse> {
  return parseJsonResponse(
    await fetch(`${baseUrl}${pathname}`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    }),
  );
}

async function getRaw(baseUrl: string, pathname: string, accessToken: string): Promise<Response> {
  return fetch(`${baseUrl}${pathname}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

async function parseJsonResponse(response: Response): Promise<FetchJsonResponse> {
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

function expectErrorBody(response: FetchJsonResponse, error: string, message?: string): void {
  expect(response.body).toEqual({
    error,
    message: message ?? expect.any(String),
  });
}

function readString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`expected ${label}`);
  }

  return value;
}

function readRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is required`);
  }

  return value;
}

async function countRows(pool: PostgresPool, table: string): Promise<number> {
  const result = await pool.query<CountRow>(`SELECT COUNT(*)::text AS count FROM ${table}`);

  return Number(result.rows[0]?.count ?? '0');
}

async function measurementStatus(pool: PostgresPool, measurementId: string): Promise<string> {
  const result = await pool.query<StatusRow>('SELECT status FROM measurements WHERE id = $1', [measurementId]);

  return readString(result.rows[0]?.status, 'measurement status');
}

async function queuedTaskId(pool: PostgresPool, measurementId: string): Promise<string> {
  const result = await pool.query<TaskRow>(
    "SELECT id FROM recognition_tasks WHERE measurement_id = $1 AND status = 'queued' LIMIT 1",
    [measurementId],
  );

  return readString(result.rows[0]?.id, 'recognition task id');
}

function findLog(logs: HttpRequestLogEntry[], method: string, path: string): HttpRequestLogEntry | undefined {
  return logs.find((log) => log.method === method && log.path === path);
}
