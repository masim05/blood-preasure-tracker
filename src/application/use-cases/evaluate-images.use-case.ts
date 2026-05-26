import type { EvaluationDatasetPort } from '../ports/evaluation-dataset.port';
import type { ImageMetadataPort, TimestampExtractionResult } from '../ports/image-metadata.port';
import type { ImageSourcePort } from '../ports/image-source.port';
import type { SourceImage } from '../ports/image-source.port';
import type { LlmProviderPort, LlmProviderResponse } from '../ports/llm-provider.port';
import type { OutputWriterPort } from '../ports/output-writer.port';
import { EvaluationReport } from '../../domain/entities/evaluation-report';
import { PredictedReading } from '../../domain/entities/predicted-reading';
import { formatEvaluationAccuracySummary } from '../../domain/services/evaluation-accuracy-formatter';
import { EvaluationMatcher } from '../../domain/services/evaluation-matcher';
import { deriveReadingStatus } from '../../domain/services/uncertainty-policy';

type EvaluateImagesCommand = {
  inputDirectory: string;
  evaluationCsvPath: string;
  model: string;
};

export class EvaluateImagesUseCase {
  constructor(
    private readonly imageSource: ImageSourcePort,
    private readonly evaluationDataset: EvaluationDatasetPort,
    private readonly imageMetadata: ImageMetadataPort,
    private readonly llmProvider: LlmProviderPort,
    private readonly outputWriter: OutputWriterPort,
    private readonly evaluationMatcher: EvaluationMatcher = new EvaluationMatcher(),
  ) {}

  async execute(command: EvaluateImagesCommand): Promise<void> {
    const images = await this.imageSource.load(command.inputDirectory);
    const groundTruthRows = await this.evaluationDataset.load(command.evaluationCsvPath);
    const predictions: PredictedReading[] = [];

    for (const image of images) {
      predictions.push(await this.evaluateImage(image, command.model));
    }

    const comparisons = this.evaluationMatcher.match(predictions, groundTruthRows);
    const evaluationReport = new EvaluationReport(
      comparisons,
      groundTruthRows.length,
      this.llmProvider.provider,
      command.model,
    );

    for (const comparison of evaluationReport.toComparisonRecords()) {
      await this.outputWriter.write(comparison);
    }

    await this.outputWriter.write(evaluationReport.toSummary());
    await this.outputWriter.writeText?.(
      formatEvaluationAccuracySummary(evaluationReport.toAccuracySummary()),
    );
  }

  private async evaluateImage(image: SourceImage, model: string): Promise<PredictedReading> {
    try {
      const metadata = await this.imageMetadata.extractTimestamp({
        imageId: image.imageId,
        imagePath: image.imagePath,
        data: image.data,
      });
      let inference: LlmProviderResponse;

      try {
        inference = await this.llmProvider.infer({
          imageId: image.imageId,
          imagePath: image.imagePath,
          contentType: image.contentType,
          data: image.data,
          model,
        });
      } catch (error) {
        return this.createErrorReading(image, model, error, metadata);
      }

      const uncertainFields = metadata.time === null
        ? [...new Set([...inference.uncertainFields, 'time'])]
        : [...inference.uncertainFields];

      return new PredictedReading({
        imageId: image.imageId,
        imagePath: image.imagePath,
        time: metadata.time,
        hand: inference.hand,
        systolic: inference.systolic,
        diastolic: inference.diastolic,
        pulse: inference.pulse,
        confidence: inference.confidence,
        status: deriveReadingStatus({
          time: metadata.time,
          hand: inference.hand,
          systolic: inference.systolic,
          diastolic: inference.diastolic,
          pulse: inference.pulse,
          uncertainFields,
        }),
        uncertainFields,
        provider: this.llmProvider.provider,
        model,
        rawNotes: inference.rawNotes,
      });
    } catch (error) {
      return this.createErrorReading(image, model, error, null);
    }
  }

  private createErrorReading(
    image: SourceImage,
    model: string,
    error: unknown,
    metadata: TimestampExtractionResult | null,
  ): PredictedReading {
    return new PredictedReading({
      imageId: image.imageId,
      imagePath: image.imagePath,
      time: metadata?.time ?? null,
      hand: null,
      systolic: null,
      diastolic: null,
      pulse: null,
      confidence: null,
      status: 'error',
      uncertainFields: metadata?.time ? [] : ['time'],
      provider: this.llmProvider.provider,
      model,
      rawNotes: unwrapErrorMessage(error),
    });
  }
}

function unwrapErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown image processing error';
}