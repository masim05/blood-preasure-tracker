/* istanbul ignore file */
import { Body, Controller, Post } from '@nestjs/common';

import { ApiConfigService } from '../../../infrastructure/config/api-config';
import { CreateAccountUseCase } from '../../../application/use-cases/create-account.use-case';
import { LoginUserUseCase } from '../../../application/use-cases/login-user.use-case';
import { toHttpException } from './http-error.mapper';
import { type AuthRequestDto, type AuthResponseDto, requireAuthRequest } from './dto/auth.dto';

@Controller('/api/v1')
export class AuthController {
  constructor(
    private readonly createAccount: CreateAccountUseCase,
    private readonly loginUser: LoginUserUseCase,
    private readonly apiConfig: ApiConfigService,
  ) {}

  @Post('/signin')
  async signin(@Body() body: AuthRequestDto): Promise<AuthResponseDto> {
    try {
      const request = requireAuthRequest(body);
      return await this.createAccount.execute({
        ...request,
        tokenTtlSeconds: this.apiConfig.load().accessTokenTtlSeconds,
      });
    } catch (error) {
      throw toHttpException(error);
    }
  }

  @Post('/login')
  async login(@Body() body: AuthRequestDto): Promise<AuthResponseDto> {
    try {
      const request = requireAuthRequest(body);
      return await this.loginUser.execute({
        ...request,
        tokenTtlSeconds: this.apiConfig.load().accessTokenTtlSeconds,
      });
    } catch (error) {
      throw toHttpException(error);
    }
  }
}
