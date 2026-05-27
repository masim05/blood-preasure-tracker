import { BearerAccessToken } from '../../../src/domain/entities/bearer-access-token';
import { UserAccount } from '../../../src/domain/entities/user-account';
import { AuthenticateBearerTokenUseCase } from '../../../src/application/use-cases/authenticate-bearer-token.use-case';
import {
  InMemoryBearerTokenStore,
  InMemoryUserStore,
  StaticTokenGenerator,
} from '../../helpers/mobile-api-fakes';

const now = new Date('2026-05-27T12:00:00.000Z');

describe('AuthenticateBearerTokenUseCase', () => {
  it('resolves active bearer token to a user', async () => {
    const users = new InMemoryUserStore();
    const tokens = new InMemoryBearerTokenStore();
    await users.save(new UserAccount({ id: 'usr_1', email: 'demo@example.com', passwordHash: 'hash', createdAt: now, updatedAt: now }));
    await tokens.save(
      new BearerAccessToken({
        id: 'tok_1',
        userId: 'usr_1',
        tokenHash: 'hash:raw-token',
        expiresAt: new Date('2026-05-27T13:00:00.000Z'),
        createdAt: now,
        revokedAt: null,
      }),
    );

    await expect(
      new AuthenticateBearerTokenUseCase(tokens, new StaticTokenGenerator(), users).execute({ accessToken: 'raw-token', now }),
    ).resolves.toEqual({ user: { id: 'usr_1', email: 'demo@example.com' } });
  });

  it('rejects expired or unknown tokens', async () => {
    const users = new InMemoryUserStore();
    const tokens = new InMemoryBearerTokenStore();
    await tokens.save(
      new BearerAccessToken({
        id: 'tok_1',
        userId: 'usr_1',
        tokenHash: 'hash:raw-token',
        expiresAt: new Date('2026-05-27T11:00:00.000Z'),
        createdAt: now,
        revokedAt: null,
      }),
    );

    await expect(
      new AuthenticateBearerTokenUseCase(tokens, new StaticTokenGenerator(), users).execute({ accessToken: 'raw-token', now }),
    ).rejects.toThrow('Bearer token is invalid or expired');
  });
});
