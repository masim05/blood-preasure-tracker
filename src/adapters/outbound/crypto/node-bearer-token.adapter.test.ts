import { createHash } from 'node:crypto';

import { NodeBearerTokenAdapter } from './node-bearer-token.adapter';

describe('NodeBearerTokenAdapter', () => {
  it('generates URL-safe opaque bearer tokens', () => {
    const token = new NodeBearerTokenAdapter().generate();

    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(token.length).toBeGreaterThanOrEqual(32);
  });

  it('hashes tokens with SHA-256 base64url encoding', () => {
    const adapter = new NodeBearerTokenAdapter();
    const expected = createHash('sha256').update('raw-token').digest('base64url');

    expect(adapter.hash('raw-token')).toBe(expected);
  });
});
