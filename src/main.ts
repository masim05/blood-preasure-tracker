import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Writable } from 'node:stream';

import { JsonlOutputWriter } from './adapters/inbound/cli/jsonl-output.writer';
import { CliParser } from './adapters/inbound/cli/cli-parser';
import { HelpRenderer } from './adapters/inbound/cli/help-renderer';
import { CsvDatasetAdapter } from './adapters/outbound/filesystem/csv-dataset.adapter';
import { ImageDirectoryAdapter } from './adapters/outbound/filesystem/image-directory.adapter';
import { ImageMetadataAdapter } from './adapters/outbound/filesystem/image-metadata.adapter';
import { PredictionCsvFileWriter } from './adapters/outbound/filesystem/prediction-csv.writer';
import { OpenAiVisionAdapter } from './adapters/outbound/llm/openai-vision.adapter';
import { ModelRegistry } from './adapters/outbound/llm/model-registry';
import { EvaluateImagesUseCase } from './application/use-cases/evaluate-images.use-case';
import { ListModelsUseCase } from './application/use-cases/list-models.use-case';
import { PredictImagesUseCase } from './application/use-cases/predict-images.use-case';
import { AppModule } from './app.module';
import type { PredictionCsvWriterPort } from './application/ports/prediction-csv-writer.port';
import {
  CliConfigService,
  type CliConfig,
  validateProviderConfig,
} from './infrastructure/config/cli-config';
import { EnvConfigService, type EnvironmentConfig } from './infrastructure/config/env-config';

type CliDependencies = {
  cliConfigService: CliConfigService;
  envConfigService: EnvConfigService;
  modelRegistry: ModelRegistry;
  imageDirectoryAdapter: ImageDirectoryAdapter;
  imageMetadataAdapter: ImageMetadataAdapter;
  evaluationDataset: CsvDatasetAdapter;
  predictionCsvWriterFactory: () => PredictionCsvWriterPort;
  helpRenderer: HelpRenderer;
};

export async function runCli(
  argv: string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
  stdout: Writable = process.stdout,
): Promise<number> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  try {
    return await runCliWithDependencies(argv, env, stdout, {
      cliConfigService: app.get(CliConfigService),
      envConfigService: app.get(EnvConfigService),
      modelRegistry: app.get(ModelRegistry),
      imageDirectoryAdapter: app.get(ImageDirectoryAdapter),
      imageMetadataAdapter: app.get(ImageMetadataAdapter),
      evaluationDataset: new CsvDatasetAdapter(),
      predictionCsvWriterFactory: () => new PredictionCsvFileWriter(),
      helpRenderer: new HelpRenderer(),
    });
  } catch (error) {
    const logger = new Logger('CliBootstrap');
    logger.error(error instanceof Error ? error.message : 'Unknown bootstrap error');
    return 1;
  } finally {
    await app.close();
  }
}

export async function runCliWithDependencies(
  argv: string[] = process.argv.slice(2),
  env: NodeJS.ProcessEnv = process.env,
  stdout: Writable = process.stdout,
  dependencies: CliDependencies = createCliDependencies(),
): Promise<number> {
  const envConfig = dependencies.envConfigService.load(env);
  const cliConfig = dependencies.cliConfigService.resolveFromEnvironment(argv, envConfig);

  if (cliConfig.command !== 'help') {
    validateProviderConfig(cliConfig, envConfig);
  }

  switch (cliConfig.command) {
    case 'help':
      stdout.write(renderHelp(dependencies.modelRegistry, dependencies.helpRenderer));
      return 0;
    case 'predict':
      return await executePredictCommand(cliConfig, envConfig, dependencies, stdout);
    case 'eval':
      return await executeEvalCommand(cliConfig, envConfig, dependencies, stdout);
  }
}

async function bootstrap(): Promise<void> {
  process.exitCode = await runCliWithDependencies();
}

/* istanbul ignore next: CLI auto-bootstrap side effect */
if (!process.env.JEST_WORKER_ID) {
  const keepAlive = setInterval(() => undefined, 1000);
  void bootstrap().finally(() => {
    clearInterval(keepAlive);
  });
}

function createProviderAdapter(apiKey: string | null, model: string): OpenAiVisionAdapter {
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required when provider is openai');
  }

  return new OpenAiVisionAdapter({ apiKey, model });
}

function createCliDependencies(): CliDependencies {
  const cliParser = new CliParser();
  const envConfigService = new EnvConfigService();

  return {
    cliConfigService: new CliConfigService(cliParser, envConfigService),
    envConfigService,
    modelRegistry: new ModelRegistry(),
    imageDirectoryAdapter: new ImageDirectoryAdapter(),
    imageMetadataAdapter: new ImageMetadataAdapter(),
    evaluationDataset: new CsvDatasetAdapter(),
    predictionCsvWriterFactory: () => new PredictionCsvFileWriter(),
    helpRenderer: new HelpRenderer(),
  };
}

async function executePredictCommand(
  cliConfig: CliConfig,
  envConfig: EnvironmentConfig,
  dependencies: CliDependencies,
  stdout: Writable,
): Promise<number> {
  const outputWriter = new JsonlOutputWriter(stdout);
  const providerAdapter = createProviderAdapter(envConfig.openAiApiKey, cliConfig.model);
  const predictImagesUseCase = new PredictImagesUseCase(
    dependencies.imageDirectoryAdapter,
    dependencies.imageMetadataAdapter,
    providerAdapter,
    outputWriter,
    dependencies.predictionCsvWriterFactory(),
  );

  await predictImagesUseCase.execute({
    inputDirectory: cliConfig.inputDirectory,
    model: cliConfig.model,
  });

  return 0;
}

async function executeEvalCommand(
  cliConfig: CliConfig,
  envConfig: EnvironmentConfig,
  dependencies: CliDependencies,
  stdout: Writable,
): Promise<number> {
  const outputWriter = new JsonlOutputWriter(stdout);
  const providerAdapter = createProviderAdapter(envConfig.openAiApiKey, cliConfig.model);
  const evaluateImagesUseCase = new EvaluateImagesUseCase(
    dependencies.imageDirectoryAdapter,
    dependencies.evaluationDataset,
    dependencies.imageMetadataAdapter,
    providerAdapter,
    outputWriter,
  );

  await evaluateImagesUseCase.execute({
    inputDirectory: cliConfig.inputDirectory,
    evaluationCsvPath: cliConfig.evaluationCsvPath,
    model: cliConfig.model,
  });

  return 0;
}

function renderHelp(modelRegistry: ModelRegistry, helpRenderer: HelpRenderer): string {
  const listModelsUseCase = new ListModelsUseCase(modelRegistry);

  return helpRenderer.render({
    list: () => listModelsUseCase.execute(),
    getDefaultModel: modelRegistry.getDefaultModel.bind(modelRegistry),
  });
}