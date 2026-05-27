import { UserAccount } from '../../../src/domain/entities/user-account';
import { normalizeEmail } from '../../../src/domain/services/email-normalization';

const now = new Date('2026-05-27T12:00:00.000Z');

describe('user account domain rules', () => {
  it('normalizes email for uniqueness', () => {
    expect(normalizeEmail('  Demo@Example.COM ')).toBe('demo@example.com');
  });

  it('rejects invalid email', () => {
    expect(() => normalizeEmail('not-email')).toThrow('email must be a valid email address');
  });

  it('serializes a valid user account', () => {
    const user = new UserAccount({
      id: 'usr_1',
      email: 'demo@example.com',
      passwordHash: 'hash',
      createdAt: now,
      updatedAt: now,
    });

    expect(user.toJSON()).toEqual({
      id: 'usr_1',
      email: 'demo@example.com',
      passwordHash: 'hash',
      createdAt: now,
      updatedAt: now,
    });
  });
});
