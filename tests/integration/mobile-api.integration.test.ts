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
    it('creates a user and bearer token in PostgreSQL', async () => {
      const response = await signIn(fixture, 'demo@example.com');

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresAt: expect.any(String),
        user: { id: expect.stringMatching(/^usr_/), email: 'demo@example.com' },
      });
      expect(await countRows(fixture.pool, 'user_accounts')).toBe(1);
      expect(await countRows(fixture.pool, 'bearer_tokens')).toBe(1);
    });
  });

  describe('POST /api/v1/signin - invalid email', () => {
    it('returns the OpenAPI validation error response', async () => {
      const response = await postJson(fixture.baseUrl, '/api/v1/signin', {
        email: 'not-an-email',
        password: 'password123',
      });

      expectError(response, 400, 'validation_error');
    });
  });

  describe('POST /api/v1/signin - email already taken', () => {
    it('returns the OpenAPI conflict response', async () => {
      await signIn(fixture, 'duplicate@example.com');
      const response = await signIn(fixture, 'duplicate@example.com');

      expectError(response, 409, 'conflict', 'Email is already registered');
    });
  });

  describe('POST /api/v1/signin - rate limited', () => {
    it('returns the OpenAPI rate limit response', async () => {
      const body = { email: 'limited-signin@example.com', password: 'short' };
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await postJson(fixture.baseUrl, '/api/v1/signin', body);
      }

      const response = await postJson(fixture.baseUrl, '/api/v1/signin', body);

      expectError(response, 429, 'rate_limited', 'Too many authentication attempts; try again later');
    });
  });

  describe('POST /api/v1/login - happy path', () => {
    it('authenticates an existing user with the real password hasher and token store', async () => {
      await signIn(fixture, 'login@example.com');
      const response = await login(fixture, 'login@example.com');

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresAt: expect.any(String),
        user: { id: expect.stringMatching(/^usr_/), email: 'login@example.com' },
      });
      expect(await countRows(fixture.pool, 'bearer_tokens')).toBe(2);
    });
  });

  describe('POST /api/v1/login - invalid email', () => {
    it('returns the OpenAPI validation error response', async () => {
      const response = await postJson(fixture.baseUrl, '/api/v1/login', {
        email: 'invalid',
        password: 'password123',
      });

      expectError(response, 400, 'validation_error');
    });
  });

  describe('POST /api/v1/login - invalid credentials', () => {
    it('returns the OpenAPI unauthorized response', async () => {
      await signIn(fixture, 'auth@example.com');
      const response = await postJson(fixture.baseUrl, '/api/v1/login', {
        email: 'auth@example.com',
        password: 'wrong-password',
      });

      expectError(response, 401, 'unauthorized', 'Invalid email or password');
    });
  });

  describe('POST /api/v1/login - rate limited', () => {
    it('returns the OpenAPI rate limit response', async () => {
      const body = { email: 'limited-login@example.com', password: 'wrong-password' };
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await postJson(fixture.baseUrl, '/api/v1/login', body);
      }

      const response = await postJson(fixture.baseUrl, '/api/v1/login', body);

      expectError(response, 429, 'rate_limited', 'Too many authentication attempts; try again later');
    });
  });

  describe('GET /api/v1/measurements - happy path empty history', () => {
    it('authenticates against PostgreSQL bearer tokens', async () => {
      const accessToken = await signedInAccessToken(fixture);
      const response = await getJson(fixture.baseUrl, '/api/v1/measurements', accessToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        items: [],
        page: 1,
        pageSize: 20,
        hasNextPage: false,
        filters: { from: null, to: null },
      });
      expect(await countRows(fixture.pool, 'measurements')).toBe(0);
    });
  });

  describe('GET /api/v1/measurements - invalid bearer token', () => {
    it('returns the OpenAPI unauthorized response', async () => {
      const response = await getJson(fixture.baseUrl, '/api/v1/measurements', 'invalid-token');

      expectError(response, 401, 'unauthorized', 'Bearer token is invalid or expired');
    });
  });

  describe('GET /api/v1/measurements - invalid date range', () => {
    it('returns the OpenAPI validation error response', async () => {
      const accessToken = await signedInAccessToken(fixture);
      const response = await getJson(
        fixture.baseUrl,
        '/api/v1/measurements?from=2026-05-31T00:00:00.000Z&to=2026-05-01T00:00:00.000Z',
        accessToken,
      );

      expectError(response, 400, 'validation_error');
    });
  });

  describe('POST /api/v1/measurements - happy path', () => {
    it('stores the image on disk and persists the queued measurement in PostgreSQL', async () => {
      const accessToken = await signedInAccessToken(fixture);
      const response = await uploadMeasurement(fixture, accessToken);
      const measurementId = readString(response.body.id, 'measurement id');

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: expect.stringMatching(/^msr_/),
        status: 'pending',
        measurementTime: expect.any(String),
      });
      expect(await countRows(fixture.pool, 'measurements')).toBe(1);
      expect(await countRows(fixture.pool, 'measurement_images')).toBe(1);
      expect(await countRows(fixture.pool, 'recognition_tasks')).toBe(1);
      expect(await measurementStatus(fixture.pool, measurementId)).toBe('pending');
      expect(fixture.llmProvider.calls).toHaveLength(0);
    });
  });

  describe('POST /api/v1/measurements - missing image', () => {
    it('returns the OpenAPI validation error response', async () => {
      const accessToken = await signedInAccessToken(fixture);
      const response = await postForm(fixture.baseUrl, '/api/v1/measurements', accessToken, new FormData());

      expectError(response, 400, 'validation_error', 'image is required');
    });
  });

  describe('POST /api/v1/measurements - missing bearer token', () => {
    it('returns the OpenAPI unauthorized response', async () => {
      const response = await postForm(fixture.baseUrl, '/api/v1/measurements', undefined, measurementForm());

      expectError(response, 401, 'unauthorized', 'Bearer token is required');
    });
  });

  describe('GET /api/v1/measurements/{id} - happy path recognized measurement', () => {
    it('returns recognized values produced through the mocked OpenAI port', async () => {
      const accessToken = await signedInAccessToken(fixture);
      const measurementId = await uploadAndRecognize(fixture, accessToken);
      const response = await getJson(fixture.baseUrl, `/api/v1/measurements/${measurementId}`, accessToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: measurementId,
        status: 'recognized',
        systolic: 122,
        diastolic: 82,
        pulse: 70,
        armSide: 'right',
        measurementTime: expect.any(String),
        imageUrl: `/api/v1/measurements/${measurementId}/image`,
      });
      expect(fixture.llmProvider.calls).toHaveLength(1);
    });
  });

  describe('GET /api/v1/measurements/{id} - missing bearer token', () => {
    it('returns the OpenAPI unauthorized response', async () => {
      const response = await getJson(fixture.baseUrl, '/api/v1/measurements/msr_missing');

      expectError(response, 401, 'unauthorized', 'Bearer token is required');
    });
  });

  describe('GET /api/v1/measurements/{id} - measurement not found', () => {
    it('returns the OpenAPI not found response', async () => {
      const accessToken = await signedInAccessToken(fixture);
      const response = await getJson(fixture.baseUrl, '/api/v1/measurements/msr_missing', accessToken);

      expectError(response, 404, 'not_found', 'Measurement was not found');
    });
  });

  describe('GET /api/v1/measurements/{id}/image - happy path', () => {
    it('returns the stored image bytes from the filesystem adapter', async () => {
      const accessToken = await signedInAccessToken(fixture);
      const response = await uploadMeasurement(fixture, accessToken);
      const measurementId = readString(response.body.id, 'measurement id');
      const imageResponse = await getRaw(fixture.baseUrl, `/api/v1/measurements/${measurementId}/image`, accessToken);

      expect(imageResponse.status).toBe(200);
      expect(imageResponse.headers.get('content-type')).toContain('image/png');
      expect((await imageResponse.arrayBuffer()).byteLength).toBe(pngBytes.byteLength);
    });
  });

  describe('GET /api/v1/measurements/{id}/image - missing bearer token', () => {
    it('returns the OpenAPI unauthorized response', async () => {
      const response = await getJson(fixture.baseUrl, '/api/v1/measurements/msr_missing/image');

      expectError(response, 401, 'unauthorized', 'Bearer token is required');
    });
  });

  describe('GET /api/v1/measurements/{id}/image - measurement not found', () => {
    it('returns the OpenAPI not found response', async () => {
      const accessToken = await signedInAccessToken(fixture);
      const response = await getJson(fixture.baseUrl, '/api/v1/measurements/msr_missing/image', accessToken);

      expectError(response, 404, 'not_found', 'Measurement was not found');
    });
  });

  describe('POST /api/v1/measurements/{id}/save - happy path', () => {
    it('persists a recognized measurement as saved in PostgreSQL', async () => {
      const accessToken = await signedInAccessToken(fixture);
      const measurementId = await uploadAndRecognize(fixture, accessToken);
      const response = await postJson(fixture.baseUrl, `/api/v1/measurements/${measurementId}/save`, {}, accessToken);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        id: measurementId,
        status: 'saved',
        systolic: 122,
        diastolic: 82,
        pulse: 70,
        armSide: 'right',
        measurementTime: expect.any(String),
        savedAt: expect.any(String),
      });
      expect(await measurementStatus(fixture.pool, measurementId)).toBe('saved');
    });
  });

  describe('POST /api/v1/measurements/{id}/save - missing bearer token', () => {
    it('returns the OpenAPI unauthorized response', async () => {
      const response = await postJson(fixture.baseUrl, '/api/v1/measurements/msr_missing/save', {});

      expectError(response, 401, 'unauthorized', 'Bearer token is required');
    });
  });

  describe('POST /api/v1/measurements/{id}/save - measurement not found', () => {
    it('returns the OpenAPI not found response', async () => {
      const accessToken = await signedInAccessToken(fixture);
      const response = await postJson(fixture.baseUrl, '/api/v1/measurements/msr_missing/save', {}, accessToken);

      expectError(response, 404, 'not_found', 'Measurement was not found');
    });
  });

  describe('POST /api/v1/measurements/{id}/save - pending measurement conflict', () => {
    it('returns the OpenAPI conflict response', async () => {
      const accessToken = await signedInAccessToken(fixture);
      const upload = await uploadMeasurement(fixture, accessToken);
      const measurementId = readString(upload.body.id, 'measurement id');
      const response = await postJson(fixture.baseUrl, `/api/v1/measurements/${measurementId}/save`, {}, accessToken);

      expectError(response, 409, 'conflict', 'Measurement must be recognized before it can be saved');
    });
  });

  describe('GET /api/v1/measurements - happy path saved history', () => {
    it('returns saved measurements without image bytes', async () => {
      const accessToken = await signedInAccessToken(fixture);
      const measurementId = await uploadAndRecognize(fixture, accessToken);
      await postJson(fixture.baseUrl, `/api/v1/measurements/${measurementId}/save`, {}, accessToken);
      const response = await getJson(fixture.baseUrl, '/api/v1/measurements', accessToken);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        items: [
          {
            id: measurementId,
            status: 'saved',
            systolic: 122,
            diastolic: 82,
            pulse: 70,
            armSide: 'right',
            measurementTime: expect.any(String),
            savedAt: expect.any(String),
          },
        ],
        page: 1,
        pageSize: 20,
        hasNextPage: false,
        filters: { from: null, to: null },
      });
      expect(JSON.stringify(response.body)).not.toContain('image/png');
    });
  });

  describe('GET /api/v1/measurements - debug logging', () => {
    it('logs request metadata without credentials, tokens, payloads, image bytes, or readings', async () => {
      const accessToken = await signedInAccessToken(fixture);
      const measurementId = await uploadAndRecognize(fixture, accessToken);
      await getJson(fixture.baseUrl, `/api/v1/measurements/${measurementId}`, accessToken);
      await postJson(fixture.baseUrl, `/api/v1/measurements/${measurementId}/save`, {}, accessToken);
      await getJson(fixture.baseUrl, '/api/v1/measurements', 'very-secret-token');

      expect(findLog(fixture.requestLogs, 'POST', '/api/v1/signin')?.statusCode).toBe(201);
      expect(findLog(fixture.requestLogs, 'POST', '/api/v1/measurements')?.statusCode).toBe(201);
      expect(findLog(fixture.requestLogs, 'GET', `/api/v1/measurements/${measurementId}`)?.statusCode).toBe(200);
      expect(findLog(fixture.requestLogs, 'POST', `/api/v1/measurements/${measurementId}/save`)?.statusCode).toBe(201);
      expect(findLog(fixture.requestLogs, 'GET', '/api/v1/measurements')?.statusCode).toBe(401);
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

function expectError(
  response: FetchJsonResponse,
  status: number,
  error: string,
  message?: string,
): void {
  expect(response.status).toBe(status);
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
