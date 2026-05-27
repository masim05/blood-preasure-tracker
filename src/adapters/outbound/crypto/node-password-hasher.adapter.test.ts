import { pbkdf2Sync } from 'node:crypto';

import { NodePasswordHasherAdapter } from './node-password-hasher.adapter';

describe('NodePasswordHasherAdapter', () => {
  it('hashes new passwords with the configured PBKDF2 work factor', async () => {
    const hash = await new NodePasswordHasherAdapter().hash('password123');

    expect(hash.split(':').slice(0, 3)).toEqual(['pbkdf2', 'sha256', '600000']);
  });

  it('verifies bounded sha256 PBKDF2 hashes and rejects unsafe stored parameters', async () => {
    const adapter = new NodePasswordHasherAdapter();
    const expected = pbkdf2Sync('password123', 'salt', 1, 32, 'sha256').toString('base64url');

    await expect(adapter.verify('password123', `pbkdf2:sha256:1:salt:${expected}`)).resolves.toBe(true);
    await expect(adapter.verify('password123', `pbkdf2:sha512:1:salt:${expected}`)).resolves.toBe(false);
    await expect(adapter.verify('password123', `pbkdf2:sha256:1000001:salt:${expected}`)).resolves.toBe(false);
  });
});
