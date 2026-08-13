import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { AuthController } from './auth.controller';
import { CreateAccountUseCase } from '../../../application/use-cases/create-account.use-case';
import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case';
import { ApiConfigService } from '../../../infrastructure/config/api-config';

describe('HTTP validation contract', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthRateLimitGuard, useValue: { canActivate: () => true } },
        { provide: CreateAccountUseCase, useValue: { execute: jest.fn() } },
        { provide: LoginUserUseCase, useValue: { execute: jest.fn() } },
        {
          provide: ApiConfigService,
          useValue: { load: () => ({ accessTokenTtlSeconds: 604800 }) },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    await app.listen(0, '127.0.0.1');
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the established exact 400 response for malformed auth input through Nest HTTP binding', async () => {
    const response = await fetch(`${await app.getUrl()}/api/v1/signin`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'demo@example.com' }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: 'validation_error',
      message: 'email and password are required',
    });
  });
});
