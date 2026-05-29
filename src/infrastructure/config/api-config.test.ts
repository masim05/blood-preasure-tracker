import { ApiConfigService } from './api-config';

describe('ApiConfigService', () => {
  it('loads required database URL with defaults', () => {
    expect(new ApiConfigService().load({ DATABASE_URL: 'postgres://example' })).toEqual({
      databaseUrl: 'postgres://example',
      apiPort: 3000,
      measurementImageDirectory: './tmp/measurement-images',
      accessTokenTtlSeconds: 604800,
    });
  });

  it('loads explicit API config values', () => {
    expect(
      new ApiConfigService().load({
        DATABASE_URL: 'postgres://example',
        API_PORT: '4000',
        MEASUREMENT_IMAGE_DIR: '/tmp/images',
        ACCESS_TOKEN_TTL_SECONDS: '120',
      }),
    ).toEqual({
      databaseUrl: 'postgres://example',
      apiPort: 4000,
      measurementImageDirectory: '/tmp/images',
      accessTokenTtlSeconds: 120,
    });
  });

  it('loads from process.env when no env object is supplied', () => {
    const previousDatabaseUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = 'postgres://runtime';

    try {
      expect(new ApiConfigService().load().databaseUrl).toBe('postgres://runtime');
    } finally {
      if (previousDatabaseUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousDatabaseUrl;
      }
    }
  });

  it('rejects missing or invalid values', () => {
    expect(() => new ApiConfigService().load({})).toThrow('DATABASE_URL is required');
    expect(() => new ApiConfigService().load({ DATABASE_URL: 'postgres://example', API_PORT: '0' })).toThrow('API_PORT must be a positive integer');
    expect(() =>
      new ApiConfigService().load({ DATABASE_URL: 'postgres://example', ACCESS_TOKEN_TTL_SECONDS: 'nope' }),
    ).toThrow('ACCESS_TOKEN_TTL_SECONDS must be a positive integer');
  });
});
