import { MiddlewareConsumer, Module, type NestModule } from '@nestjs/common';

import { AuthController } from './adapters/inbound/http/auth.controller';
import { AuthRateLimitGuard } from './adapters/inbound/http/auth-rate-limit.guard';
import { BearerAuthGuard } from './adapters/inbound/http/bearer-auth.guard';
import { HttpRequestLoggingMiddleware } from './adapters/inbound/http/http-request-logging';
import { MeasurementsController } from './adapters/inbound/http/measurements.controller';
import { RecognitionTaskWorker } from './adapters/inbound/worker/recognition-task.worker';
import { NodeBearerTokenAdapter } from './adapters/outbound/crypto/node-bearer-token.adapter';
import { NodePasswordHasherAdapter } from './adapters/outbound/crypto/node-password-hasher.adapter';
import { FilesystemMeasurementImageStorageAdapter } from './adapters/outbound/filesystem/measurement-image-storage.adapter';
import { ModelRegistry } from './adapters/outbound/llm/model-registry';
import { OpenAiVisionAdapter } from './adapters/outbound/llm/openai-vision.adapter';
import { PostgresBearerTokenRepository } from './adapters/outbound/postgres/bearer-token.repository';
import { PostgresMeasurementRepository } from './adapters/outbound/postgres/measurement.repository';
import { PostgresPool } from './adapters/outbound/postgres/postgres-pool';
import { PostgresRecognitionTaskRepository } from './adapters/outbound/postgres/recognition-task.repository';
import { PostgresUserAccountRepository } from './adapters/outbound/postgres/user-account.repository';
import { BEARER_TOKEN_GENERATOR, BEARER_TOKEN_STORE } from './application/ports/bearer-token-store.port';
import { MEASUREMENT_IMAGE_STORE } from './application/ports/measurement-image-store.port';
import { MEASUREMENT_STORE } from './application/ports/measurement-store.port';
import { PASSWORD_HASHER } from './application/ports/password-hasher.port';
import { RECOGNITION_TASK_STORE } from './application/ports/recognition-task-store.port';
import { USER_ACCOUNT_STORE } from './application/ports/user-account-store.port';
import { AuthenticateBearerTokenUseCase } from './application/use-cases/authenticate-bearer-token.use-case';
import { CreateAccountUseCase } from './application/use-cases/create-account.use-case';
import { GetMeasurementDetailUseCase } from './application/use-cases/get-measurement-detail.use-case';
import { GetMeasurementImageUseCase } from './application/use-cases/get-measurement-image.use-case';
import { ListMeasurementsUseCase } from './application/use-cases/list-measurements.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { LLM_PROVIDER, ProcessRecognitionTaskUseCase } from './application/use-cases/process-recognition-task.use-case';
import { SaveMeasurementUseCase } from './application/use-cases/save-measurement.use-case';
import { SubmitMeasurementImageUseCase } from './application/use-cases/submit-measurement-image.use-case';
import { ApiConfigService } from './infrastructure/config/api-config';
import { EnvConfigService } from './infrastructure/config/env-config';

@Module({
  controllers: [AuthController, MeasurementsController],
  providers: [
    ApiConfigService,
    EnvConfigService,
    ModelRegistry,
    PostgresPool,
    AuthRateLimitGuard,
    BearerAuthGuard,
    CreateAccountUseCase,
    LoginUserUseCase,
    AuthenticateBearerTokenUseCase,
    SubmitMeasurementImageUseCase,
    GetMeasurementDetailUseCase,
    GetMeasurementImageUseCase,
    SaveMeasurementUseCase,
    ProcessRecognitionTaskUseCase,
    ListMeasurementsUseCase,
    RecognitionTaskWorker,
    { provide: USER_ACCOUNT_STORE, useClass: PostgresUserAccountRepository },
    { provide: BEARER_TOKEN_STORE, useClass: PostgresBearerTokenRepository },
    { provide: MEASUREMENT_STORE, useClass: PostgresMeasurementRepository },
    { provide: RECOGNITION_TASK_STORE, useClass: PostgresRecognitionTaskRepository },
    { provide: MEASUREMENT_IMAGE_STORE, useClass: FilesystemMeasurementImageStorageAdapter },
    { provide: PASSWORD_HASHER, useClass: NodePasswordHasherAdapter },
    { provide: BEARER_TOKEN_GENERATOR, useClass: NodeBearerTokenAdapter },
    {
      provide: LLM_PROVIDER,
      inject: [EnvConfigService, ModelRegistry],
      useFactory: (envConfig: EnvConfigService, modelRegistry: ModelRegistry): OpenAiVisionAdapter => {
        const config = envConfig.load();
        if (!config.openAiApiKey) {
          throw new Error('OPENAI_API_KEY is required for recognition processing');
        }

        return new OpenAiVisionAdapter({
          apiKey: config.openAiApiKey,
          model: modelRegistry.getDefaultModel(config.provider),
        });
      },
    },
  ],
  exports: [ApiConfigService, EnvConfigService, ModelRegistry],
})
export class ApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpRequestLoggingMiddleware).forRoutes('*');
  }
}
