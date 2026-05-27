import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { BearerAuthGuard } from '../../src/adapters/inbound/http/bearer-auth.guard';
import { AuthController } from '../../src/adapters/inbound/http/auth.controller';
import { MeasurementsController } from '../../src/adapters/inbound/http/measurements.controller';
import { ApiConfigService } from '../../src/infrastructure/config/api-config';
import { BEARER_TOKEN_GENERATOR, BEARER_TOKEN_STORE } from '../../src/application/ports/bearer-token-store.port';
import { MEASUREMENT_IMAGE_STORE } from '../../src/application/ports/measurement-image-store.port';
import { MEASUREMENT_STORE } from '../../src/application/ports/measurement-store.port';
import { PASSWORD_HASHER } from '../../src/application/ports/password-hasher.port';
import { RECOGNITION_TASK_STORE } from '../../src/application/ports/recognition-task-store.port';
import { USER_ACCOUNT_STORE } from '../../src/application/ports/user-account-store.port';
import { AuthenticateBearerTokenUseCase } from '../../src/application/use-cases/authenticate-bearer-token.use-case';
import { CreateAccountUseCase } from '../../src/application/use-cases/create-account.use-case';
import { GetMeasurementDetailUseCase } from '../../src/application/use-cases/get-measurement-detail.use-case';
import { GetMeasurementImageUseCase } from '../../src/application/use-cases/get-measurement-image.use-case';
import { ListMeasurementsUseCase } from '../../src/application/use-cases/list-measurements.use-case';
import { LoginUserUseCase } from '../../src/application/use-cases/login-user.use-case';
import { SaveMeasurementUseCase } from '../../src/application/use-cases/save-measurement.use-case';
import { SubmitMeasurementImageUseCase } from '../../src/application/use-cases/submit-measurement-image.use-case';
import { Measurement } from '../../src/domain/entities/measurement';
import {
  InMemoryBearerTokenStore,
  InMemoryMeasurementImageStore,
  InMemoryMeasurementStore,
  InMemoryRecognitionTaskStore,
  InMemoryUserStore,
  SimplePasswordHasher,
  StaticTokenGenerator,
} from '../helpers/mobile-api-fakes';

const apiConfig = {
  load: () => ({
    databaseUrl: 'postgres://example',
    apiPort: 3000,
    measurementImageDirectory: './tmp/images',
    accessTokenTtlSeconds: 3600,
  }),
} as ApiConfigService;

describe('mobile API integration flow', () => {
  describe('creates user', () => {
    let fixture: MobileApiFixture;
    let response: FetchResponse;

    beforeAll(async () => {
      fixture = await createMobileApiFixture();
      response = await postJson(fixture.baseUrl, '/api/v1/signin', {
        email: 'demo@example.com',
        password: 'password123',
      });
      saveAuthResponse(fixture, response);
    });

    afterAll(async () => {
      await fixture.app.close();
    });

    it('returns HTTP 201', () => {
      expect(response.status).toBe(201);
    });

    it('returns the auth response format', () => {
      expect(response.body).toEqual({
        accessToken: 'access-token',
        tokenType: 'Bearer',
        expiresAt: expect.any(String),
        user: { id: expect.stringMatching(/^usr_/), email: 'demo@example.com' },
      });
    });

    it('persists the user account', () => {
      expect(fixture.users.users.size).toBe(1);
    });

    it('persists the bearer token', () => {
      expect(fixture.tokens.tokens.size).toBe(1);
    });
  });

  describe('authenticates bearer token', () => {
    let fixture: MobileApiFixture;
    let response: FetchResponse;

    beforeAll(async () => {
      fixture = await createSignedInFixture();
      response = await getJson(fixture.baseUrl, '/api/v1/measurements', fixture.accessToken);
    });

    afterAll(async () => {
      await fixture.app.close();
    });

    it('returns HTTP 200', () => {
      expect(response.status).toBe(200);
    });

    it('returns an empty history response format', () => {
      expect(response.body).toEqual({
        items: [],
        page: 1,
        pageSize: 20,
        hasNextPage: false,
        filters: { from: null, to: null },
      });
    });

    it('does not create measurements during authentication', () => {
      expect(fixture.measurements.measurements.size).toBe(0);
    });
  });

  describe('uploads', () => {
    let fixture: MobileApiFixture;
    let response: FetchResponse;

    beforeAll(async () => {
      fixture = await createSignedInFixture();
      const form = new FormData();
      form.append('image', new Blob([Buffer.from('png')], { type: 'image/png' }), 'bp.png');
      response = await postForm(fixture.baseUrl, '/api/v1/measurements', fixture.accessToken, form);
      fixture.measurementId = readString(response.body.id, 'measurement id');
    });

    afterAll(async () => {
      await fixture.app.close();
    });

    it('returns HTTP 201', () => {
      expect(response.status).toBe(201);
    });

    it('returns the pending measurement response format', () => {
      expect(response.body).toEqual({
        id: expect.stringMatching(/^msr_/),
        status: 'pending',
        measurementTime: expect.any(String),
      });
    });

    it('persists the pending measurement', () => {
      expect(fixture.measurements.measurements.get(fixture.measurementId)?.status).toBe('pending');
    });

    it('persists the uploaded image', () => {
      expect(fixture.images.images.has(fixture.measurementId)).toBe(true);
    });

    it('queues a recognition task', () => {
      expect(fixture.recognitionTasks.tasks.size).toBe(1);
    });
  });

  describe('saves', () => {
    let fixture: MobileApiFixture;
    let response: FetchResponse;

    beforeAll(async () => {
      fixture = await createUploadedFixture();
      await markMeasurementRecognized(fixture);
      response = await postJson(fixture.baseUrl, `/api/v1/measurements/${fixture.measurementId}/save`, {}, fixture.accessToken);
    });

    afterAll(async () => {
      await fixture.app.close();
    });

    it('returns HTTP 201', () => {
      expect(response.status).toBe(201);
    });

    it('returns the saved measurement response format', () => {
      expect(response.body).toEqual({
        id: fixture.measurementId,
        status: 'saved',
        systolic: 122,
        diastolic: 82,
        pulse: 70,
        armSide: 'right',
        measurementTime: expect.any(String),
        savedAt: expect.any(String),
      });
    });

    it('updates the persisted measurement status', () => {
      expect(fixture.measurements.measurements.get(fixture.measurementId)?.status).toBe('saved');
    });

    it('persists the saved timestamp', () => {
      expect(fixture.measurements.measurements.get(fixture.measurementId)?.savedAt).toBeInstanceOf(Date);
    });
  });

  describe('lists history', () => {
    let fixture: MobileApiFixture;
    let response: FetchResponse;

    beforeAll(async () => {
      fixture = await createSavedFixture();
      response = await getJson(fixture.baseUrl, '/api/v1/measurements', fixture.accessToken);
    });

    afterAll(async () => {
      await fixture.app.close();
    });

    it('returns HTTP 200', () => {
      expect(response.status).toBe(200);
    });

    it('returns the history response format', () => {
      expect(response.body).toEqual({
        items: [expect.any(Object)],
        page: 1,
        pageSize: 20,
        hasNextPage: false,
        filters: { from: null, to: null },
      });
    });

    it('includes the saved measurement', () => {
      expect(response.body.items[0]).toEqual({
        id: fixture.measurementId,
        status: 'saved',
        systolic: 122,
        diastolic: 82,
        pulse: 70,
        armSide: 'right',
        measurementTime: expect.any(String),
        savedAt: expect.any(String),
      });
    });

    it('keeps exactly one saved measurement in storage', () => {
      expect([...fixture.measurements.measurements.values()].filter((measurement) => measurement.status === 'saved')).toHaveLength(1);
    });
  });
});

type MobileApiFixture = {
  app: INestApplication;
  baseUrl: string;
  users: InMemoryUserStore;
  tokens: InMemoryBearerTokenStore;
  measurements: InMemoryMeasurementStore;
  images: InMemoryMeasurementImageStore;
  recognitionTasks: InMemoryRecognitionTaskStore;
  accessToken: string;
  userId: string;
  measurementId: string;
};

type FetchResponse = {
  status: number;
  body: Record<string, unknown>;
};

async function createMobileApiFixture(): Promise<MobileApiFixture> {
  const users = new InMemoryUserStore();
  const tokens = new InMemoryBearerTokenStore();
  const measurements = new InMemoryMeasurementStore();
  const images = new InMemoryMeasurementImageStore();
  const recognitionTasks = new InMemoryRecognitionTaskStore();
  const moduleRef = await Test.createTestingModule({
    controllers: [AuthController, MeasurementsController],
    providers: [
      BearerAuthGuard,
      CreateAccountUseCase,
      LoginUserUseCase,
      AuthenticateBearerTokenUseCase,
      SubmitMeasurementImageUseCase,
      GetMeasurementDetailUseCase,
      SaveMeasurementUseCase,
      ListMeasurementsUseCase,
      GetMeasurementImageUseCase,
      { provide: USER_ACCOUNT_STORE, useValue: users },
      { provide: BEARER_TOKEN_STORE, useValue: tokens },
      { provide: MEASUREMENT_STORE, useValue: measurements },
      { provide: MEASUREMENT_IMAGE_STORE, useValue: images },
      { provide: RECOGNITION_TASK_STORE, useValue: recognitionTasks },
      { provide: PASSWORD_HASHER, useClass: SimplePasswordHasher },
      { provide: BEARER_TOKEN_GENERATOR, useValue: new StaticTokenGenerator('access-token') },
      { provide: ApiConfigService, useValue: apiConfig },
    ],
  }).compile();
  const app = moduleRef.createNestApplication();

  await app.listen(0);

  return {
    app,
    baseUrl: await app.getUrl(),
    users,
    tokens,
    measurements,
    images,
    recognitionTasks,
    accessToken: '',
    userId: '',
    measurementId: '',
  };
}

async function createSignedInFixture(): Promise<MobileApiFixture> {
  const fixture = await createMobileApiFixture();
  const response = await postJson(fixture.baseUrl, '/api/v1/signin', {
    email: 'demo@example.com',
    password: 'password123',
  });
  saveAuthResponse(fixture, response);

  return fixture;
}

async function createUploadedFixture(): Promise<MobileApiFixture> {
  const fixture = await createSignedInFixture();
  const form = new FormData();
  form.append('image', new Blob([Buffer.from('png')], { type: 'image/png' }), 'bp.png');
  const response = await postForm(fixture.baseUrl, '/api/v1/measurements', fixture.accessToken, form);
  fixture.measurementId = readString(response.body.id, 'measurement id');

  return fixture;
}

async function createSavedFixture(): Promise<MobileApiFixture> {
  const fixture = await createUploadedFixture();
  await markMeasurementRecognized(fixture);
  await postJson(fixture.baseUrl, `/api/v1/measurements/${fixture.measurementId}/save`, {}, fixture.accessToken);

  return fixture;
}

function saveAuthResponse(fixture: MobileApiFixture, response: FetchResponse): void {
  fixture.accessToken = readString(response.body.accessToken, 'access token');
  const user = response.body.user;
  if (!user || typeof user !== 'object' || !('id' in user)) {
    throw new Error('expected auth response user');
  }
  fixture.userId = readString(user.id, 'user id');
}

async function postJson(
  baseUrl: string,
  pathname: string,
  body: unknown,
  accessToken?: string,
): Promise<FetchResponse> {
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
  accessToken: string,
  form: FormData,
): Promise<FetchResponse> {
  return parseJsonResponse(
    await fetch(`${baseUrl}${pathname}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    }),
  );
}

async function getJson(baseUrl: string, pathname: string, accessToken: string): Promise<FetchResponse> {
  return parseJsonResponse(
    await fetch(`${baseUrl}${pathname}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  );
}

async function parseJsonResponse(response: Response): Promise<FetchResponse> {
  return { status: response.status, body: (await response.json()) as Record<string, unknown> };
}

function readString(value: unknown, label: string): string {
  if (typeof value !== 'string') {
    throw new Error(`expected ${label}`);
  }

  return value;
}

async function markMeasurementRecognized(fixture: MobileApiFixture): Promise<void> {
  const pending = fixture.measurements.measurements.get(fixture.measurementId);
  if (!pending) {
    throw new Error('expected uploaded measurement');
  }
  await fixture.measurements.save(
    new Measurement({
      ...pending.toJSON(),
      status: 'recognized',
      systolic: 122,
      diastolic: 82,
      pulse: 70,
      armSide: 'right',
    }),
  );
}
