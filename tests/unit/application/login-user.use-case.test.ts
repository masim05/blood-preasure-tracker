import { CreateAccountUseCase } from '../../../src/application/use-cases/create-account.use-case';
import { LoginUserUseCase } from '../../../src/application/use-cases/login-user.use-case';
import {
  InMemoryBearerTokenStore,
  InMemoryUserStore,
  SimplePasswordHasher,
  StaticTokenGenerator,
} from '../../helpers/mobile-api-fakes';

const now = new Date('2026-05-27T12:00:00.000Z');

describe('LoginUserUseCase', () => {
  it('returns a new bearer token for valid credentials', async () => {
    const users = new InMemoryUserStore();
    const tokens = new InMemoryBearerTokenStore();
    const hasher = new SimplePasswordHasher();
    await new CreateAccountUseCase(users, hasher, tokens, new StaticTokenGenerator('signup-token')).execute({
      email: 'demo@example.com',
      password: 'password123',
      now,
      tokenTtlSeconds: 3600,
    });

    const output = await new LoginUserUseCase(users, hasher, tokens, new StaticTokenGenerator('login-token')).execute({
      email: 'demo@example.com',
      password: 'password123',
      now,
      tokenTtlSeconds: 60,
    });

    expect(output.accessToken).toBe('login-token');
    expect(output.expiresAt).toBe('2026-05-27T12:01:00.000Z');
  });

  it('uses generic failures for missing user or wrong password', async () => {
    const users = new InMemoryUserStore();
    const useCase = new LoginUserUseCase(
      users,
      new SimplePasswordHasher(),
      new InMemoryBearerTokenStore(),
      new StaticTokenGenerator(),
    );

    await expect(
      useCase.execute({ email: 'missing@example.com', password: 'password123', now, tokenTtlSeconds: 1 }),
    ).rejects.toThrow('Invalid email or password');
  });
});
