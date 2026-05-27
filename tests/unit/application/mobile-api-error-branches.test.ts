import { BearerAccessToken } from '../../../src/domain/entities/bearer-access-token';
import { UserAccount } from '../../../src/domain/entities/user-account';
import { AuthenticateBearerTokenUseCase } from '../../../src/application/use-cases/authenticate-bearer-token.use-case';
import { LoginUserUseCase } from '../../../src/application/use-cases/login-user.use-case';
import { LLM_PROVIDER, ProcessRecognitionTaskUseCase } from '../../../src/application/use-cases/process-recognition-task.use-case';
import { SubmitMeasurementImageUseCase } from '../../../src/application/use-cases/submit-measurement-image.use-case';
import type { LlmProviderPort } from '../../../src/application/ports/llm-provider.port';
import {
  InMemoryBearerTokenStore,
  InMemoryMeasurementImageStore,
  InMemoryMeasurementStore,
  InMemoryRecognitionTaskStore,
  InMemoryUserStore,
  SimplePasswordHasher,
  StaticTokenGenerator,
} from '../../helpers/mobile-api-fakes';

void LLM_PROVIDER;

const now = new Date('2026-05-27T12:00:00.000Z');

describe('mobile API use-case error branches', () => {
  it('rejects login requests with invalid email syntax', async () => {
    await expect(
      new LoginUserUseCase(
        new InMemoryUserStore(),
        new SimplePasswordHasher(),
        new InMemoryBearerTokenStore(),
        new StaticTokenGenerator(),
      ).execute({ email: 'bad-email', password: 'password123', tokenTtlSeconds: 1, now }),
    ).rejects.toThrow('Email must be valid');
  });

  it('rejects tokens whose user no longer exists', async () => {
    const tokens = new InMemoryBearerTokenStore();
    await tokens.save(
      new BearerAccessToken({
        id: 'tok_1',
        userId: 'missing',
        tokenHash: 'hash:raw-token',
        expiresAt: new Date('2026-05-27T13:00:00.000Z'),
        createdAt: now,
        revokedAt: null,
      }),
    );

    await expect(
      new AuthenticateBearerTokenUseCase(tokens, new StaticTokenGenerator(), new InMemoryUserStore()).execute({ accessToken: 'raw-token', now }),
    ).rejects.toThrow('Bearer token is invalid or expired');
  });

  it('marks recognition failed when provider returns incomplete values', async () => {
    const measurements = new InMemoryMeasurementStore();
    const images = new InMemoryMeasurementImageStore();
    const tasks = new InMemoryRecognitionTaskStore();
    const users = new InMemoryUserStore();
    await users.save(new UserAccount({ id: 'usr_1', email: 'demo@example.com', passwordHash: 'hash', createdAt: now, updatedAt: now }));
    await new SubmitMeasurementImageUseCase(measurements, images, tasks).execute({
      userId: 'usr_1',
      contentType: 'image/jpeg',
      originalName: 'bp.jpg',
      data: Buffer.from('image'),
      now,
    });
    const provider: LlmProviderPort = {
      provider: 'test',
      infer: jest.fn().mockResolvedValue({ hand: null, systolic: null, diastolic: null, pulse: null, confidence: null, uncertainFields: [], rawNotes: null }),
    };

    await new ProcessRecognitionTaskUseCase(tasks, measurements, images, provider).execute({ taskId: [...tasks.tasks.keys()][0], model: 'model', now });

    expect([...measurements.measurements.values()][0].status).toBe('failed');
  });
});
