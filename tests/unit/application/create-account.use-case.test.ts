import { CreateAccountUseCase } from '../../../src/application/use-cases/create-account.use-case';
import {
  InMemoryBearerTokenStore,
  InMemoryUserStore,
  SimplePasswordHasher,
  StaticTokenGenerator,
} from '../../helpers/mobile-api-fakes';

const now = new Date('2026-05-27T12:00:00.000Z');

describe('CreateAccountUseCase', () => {
  it('creates normalized account and expiring bearer token', async () => {
    const users = new InMemoryUserStore();
    const tokens = new InMemoryBearerTokenStore();
    const useCase = new CreateAccountUseCase(users, new SimplePasswordHasher(), tokens, new StaticTokenGenerator());

    const output = await useCase.execute({
      email: 'Demo@Example.COM',
      password: 'password123',
      now,
      tokenTtlSeconds: 3600,
    });

    expect(output.accessToken).toBe('raw-token');
    expect(output.expiresAt).toBe('2026-05-27T13:00:00.000Z');
    expect(output.user.email).toBe('demo@example.com');
    expect(users.users.size).toBe(1);
    expect(tokens.tokens.size).toBe(1);
  });

  it('rejects duplicate emails and invalid input', async () => {
    const users = new InMemoryUserStore();
    const useCase = new CreateAccountUseCase(
      users,
      new SimplePasswordHasher(),
      new InMemoryBearerTokenStore(),
      new StaticTokenGenerator(),
    );
    await useCase.execute({ email: 'demo@example.com', password: 'password123', now, tokenTtlSeconds: 1 });

    await expect(
      useCase.execute({ email: 'DEMO@example.com', password: 'password123', now, tokenTtlSeconds: 1 }),
    ).rejects.toThrow('Email is already registered');
    await expect(
      useCase.execute({ email: 'bad-email', password: 'password123', now, tokenTtlSeconds: 1 }),
    ).rejects.toThrow('Email must be valid');
    await expect(
      useCase.execute({ email: 'new@example.com', password: 'short', now, tokenTtlSeconds: 1 }),
    ).rejects.toThrow('Password must be at least 8 characters');
  });
});
