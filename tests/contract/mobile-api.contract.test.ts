import { HttpException, StreamableFile } from '@nestjs/common';

import { AuthController } from '../../src/adapters/inbound/http/auth.controller';
import { MeasurementsController } from '../../src/adapters/inbound/http/measurements.controller';
import type { AuthenticatedHttpRequest } from '../../src/adapters/inbound/http/bearer-auth.guard';
import type { ApiConfigService } from '../../src/infrastructure/config/api-config';
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

const now = new Date('2026-05-27T12:00:00.000Z');
const apiConfig = {
  load: () => ({
    databaseUrl: 'postgres://example',
    apiPort: 3000,
    measurementImageDirectory: './tmp/images',
    accessTokenTtlSeconds: 3600,
  }),
} as ApiConfigService;

describe('mobile API contract controllers', () => {
  it('supports POST /api/v1/signin and duplicate conflict', async () => {
    const users = new InMemoryUserStore();
    const controller = new AuthController(
      new CreateAccountUseCase(users, new SimplePasswordHasher(), new InMemoryBearerTokenStore(), new StaticTokenGenerator()),
      new LoginUserUseCase(users, new SimplePasswordHasher(), new InMemoryBearerTokenStore(), new StaticTokenGenerator()),
      apiConfig,
    );

    await expect(controller.signin({ email: 'demo@example.com', password: 'password123' })).resolves.toMatchObject({
      tokenType: 'Bearer',
      user: { email: 'demo@example.com' },
    });
    await expectStatus(controller.signin({ email: 'demo@example.com', password: 'password123' }), 409);
    await expectStatus(controller.signin({ email: 'invalid', password: 'password123' }), 400);
  });

  it('supports POST /api/v1/login credential success and failure', async () => {
    const users = new InMemoryUserStore();
    const tokens = new InMemoryBearerTokenStore();
    const hasher = new SimplePasswordHasher();
    const controller = new AuthController(
      new CreateAccountUseCase(users, hasher, tokens, new StaticTokenGenerator('signin-token')),
      new LoginUserUseCase(users, hasher, tokens, new StaticTokenGenerator('login-token')),
      apiConfig,
    );
    await controller.signin({ email: 'demo@example.com', password: 'password123' });

    await expect(controller.login({ email: 'demo@example.com', password: 'password123' })).resolves.toMatchObject({
      accessToken: 'login-token',
    });
    await expectStatus(controller.login({ email: 'demo@example.com', password: 'wrong-password' }), 401);
  });

  it('supports measurement upload, detail, image retrieval, save, and history contracts', async () => {
    const measurements = new InMemoryMeasurementStore();
    const images = new InMemoryMeasurementImageStore();
    const controller = new MeasurementsController(
      new SubmitMeasurementImageUseCase(measurements, images, new InMemoryRecognitionTaskStore()),
      new GetMeasurementDetailUseCase(measurements, images),
      new SaveMeasurementUseCase(measurements),
      new ListMeasurementsUseCase(measurements),
      new GetMeasurementImageUseCase(measurements, images),
    );
    const request = authenticatedRequest();

    const upload = await controller.upload(request, {
      originalname: 'bp.jpg',
      mimetype: 'image/jpeg',
      buffer: Buffer.from('image'),
      size: 5,
    });
    expect(upload).toMatchObject({ status: 'pending' });
    const measurementId = (upload as { id: string }).id;
    const pending = await controller.detail(request, measurementId);
    expect(pending).toMatchObject({ id: measurementId, status: 'pending', imageUrl: `/api/v1/measurements/${measurementId}/image` });

    const original = measurements.measurements.get(measurementId);
    if (!original) {
      throw new Error('expected uploaded measurement');
    }
    await measurements.save(
      new Measurement({
        ...original.toJSON(),
        status: 'recognized',
        systolic: 120,
        diastolic: 80,
        pulse: 68,
        armSide: 'left',
      }),
    );
    await expect(controller.save(request, measurementId)).resolves.toMatchObject({ status: 'saved' });
    await expect(controller.list(request, { page: '1', pageSize: '20' })).resolves.toMatchObject({
      items: [expect.objectContaining({ id: measurementId, status: 'saved' })],
      hasNextPage: false,
    });

    const headers = new Map<string, string>();
    const image = await controller.image(request, measurementId, {
      setHeader: (name: string, value: string) => headers.set(name, value),
    });
    expect(image).toBeInstanceOf(StreamableFile);
    expect(headers.get('Content-Type')).toBe('image/jpeg');
  });

  it('returns expected measurement route errors', async () => {
    const controller = new MeasurementsController(
      new SubmitMeasurementImageUseCase(
        new InMemoryMeasurementStore(),
        new InMemoryMeasurementImageStore(),
        new InMemoryRecognitionTaskStore(),
      ),
      new GetMeasurementDetailUseCase(new InMemoryMeasurementStore(), new InMemoryMeasurementImageStore()),
      new SaveMeasurementUseCase(new InMemoryMeasurementStore()),
      new ListMeasurementsUseCase(new InMemoryMeasurementStore()),
      new GetMeasurementImageUseCase(new InMemoryMeasurementStore(), new InMemoryMeasurementImageStore()),
    );

    await expectStatus(controller.upload(authenticatedRequest(), undefined), 400);
    await expectStatus(controller.detail(authenticatedRequest(), 'missing'), 404);
    await expectStatus(controller.upload({ headers: {} }, { originalname: 'bp.jpg', mimetype: 'image/jpeg', buffer: Buffer.from('x'), size: 1 }), 401);
  });
});

function authenticatedRequest(): AuthenticatedHttpRequest {
  return { headers: {}, user: { id: 'usr_1', email: 'demo@example.com' } };
}

async function expectStatus(promise: Promise<unknown>, status: number): Promise<void> {
  try {
    await promise;
    throw new Error(`Expected status ${status}`);
  } catch (error) {
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(status);
  }
}
