import { Module } from '@nestjs/common';

import { CliParser } from './adapters/inbound/cli/cli-parser';
import { HelpRenderer } from './adapters/inbound/cli/help-renderer';
import { JsonlOutputWriter } from './adapters/inbound/cli/jsonl-output.writer';
import { ImageDirectoryAdapter } from './adapters/outbound/filesystem/image-directory.adapter';
import { ImageMetadataAdapter } from './adapters/outbound/filesystem/image-metadata.adapter';
import { PredictionCsvFileWriter } from './adapters/outbound/filesystem/prediction-csv.writer';
import { ModelRegistry } from './adapters/outbound/llm/model-registry';
import { ListModelsUseCase } from './application/use-cases/list-models.use-case';
import { CliConfigService } from './infrastructure/config/cli-config';
import { EnvConfigService } from './infrastructure/config/env-config';

@Module({
  providers: [
    CliParser,
    HelpRenderer,
    JsonlOutputWriter,
    ImageDirectoryAdapter,
    ImageMetadataAdapter,
    PredictionCsvFileWriter,
    ModelRegistry,
    ListModelsUseCase,
    EnvConfigService,
    CliConfigService,
  ],
  exports: [
    CliParser,
    HelpRenderer,
    JsonlOutputWriter,
    ImageDirectoryAdapter,
    ImageMetadataAdapter,
    PredictionCsvFileWriter,
    ModelRegistry,
    ListModelsUseCase,
    EnvConfigService,
    CliConfigService,
  ],
})
export class AppModule {}