import { BearerAuthGuard } from '../../src/adapters/inbound/http/bearer-auth.guard';
import { AuthController } from '../../src/adapters/inbound/http/auth.controller';
import { MeasurementsController } from '../../src/adapters/inbound/http/measurements.controller';
import type { ApiConfigService } from '../../src/infrastructure/config/api-config';
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
  it('creates user, authenticates bearer token, uploads, saves, and lists history', async () => {
    const users = new InMemoryUserStore();
    const tokens = new InMemoryBearerTokenStore();
    const hasher = new SimplePasswordHasher();
    const tokenGenerator = new StaticTokenGenerator('access-token');
    const measurements = new InMemoryMeasurementStore();
    const images = new InMemoryMeasurementImageStore();
    const authController = new AuthController(
      new CreateAccountUseCase(users, hasher, tokens, tokenGenerator),
      new LoginUserUseCase(users, hasher, tokens, tokenGenerator),
      apiConfig,
    );
    const guard = new BearerAuthGuard(new AuthenticateBearerTokenUseCase(tokens, tokenGenerator, users));
    const measurementController = new MeasurementsController(
      new SubmitMeasurementImageUseCase(measurements, images, new InMemoryRecognitionTaskStore()),
      new GetMeasurementDetailUseCase(measurements, images),
      new SaveMeasurementUseCase(measurements),
      new ListMeasurementsUseCase(measurements),
      new GetMeasurementImageUseCase(measurements, images),
    );

    const signin = await authController.signin({ email: 'demo@example.com', password: 'password123' });
    const request = { headers: { authorization: `Bearer ${signin.accessToken}` } };
    await guard.canActivate({ switchToHttp: () => ({ getRequest: () => request }) } as ExecutionContextStub);

    const upload = await measurementController.upload(request, {
      originalname: 'bp.png',
      mimetype: 'image/png',
      buffer: Buffer.from('png'),
      size: 3,
    });
    const measurementId = (upload as { id: string }).id;
    const pending = measurements.measurements.get(measurementId);
    if (!pending) {
      throw new Error('expected uploaded measurement');
    }
    await measurements.save(
      new Measurement({
        ...pending.toJSON(),
        status: 'recognized',
        systolic: 122,
        diastolic: 82,
        pulse: 70,
        armSide: 'right',
      }),
    );

    await expect(measurementController.save(request, measurementId)).resolves.toMatchObject({ status: 'saved' });
    await expect(measurementController.list(request, {})).resolves.toMatchObject({
      items: [expect.objectContaining({ id: measurementId, systolic: 122 })],
    });
  });
});

type ExecutionContextStub = {
  switchToHttp(): { getRequest(): { headers: { authorization: string }; user?: { id: string; email: string } } };
};
