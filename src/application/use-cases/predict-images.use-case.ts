import type { ImageSourcePort } from '../ports/image-source.port';
import type { ImageMetadataPort, TimestampExtractionResult } from '../ports/image-metadata.port';
import type { SourceImage } from '../ports/image-source.port';
import type { LlmProviderPort, LlmProviderResponse } from '../ports/llm-provider.port';
import type { OutputWriterPort } from '../ports/output-writer.port';
import type { PredictionCsvWriterPort } from '../ports/prediction-csv-writer.port';
import { PredictedReading } from '../../domain/entities/predicted-reading';
import { deriveReadingStatus } from '../../domain/services/uncertainty-policy';

type PredictImagesCommand = {
  inputDirectory: string;
  model: string;
};

export class PredictImagesUseCase {
  constructor(
    private readonly imageSource: ImageSourcePort,
    private readonly imageMetadata: ImageMetadataPort,
    private readonly llmProvider: LlmProviderPort,
    private readonly outputWriter: OutputWriterPort,
    private readonly predictionCsvWriter: PredictionCsvWriterPort,
  ) {}

  async execute(command: PredictImagesCommand): Promise<void> {
    await this.predictionCsvWriter.open(command.inputDirectory);
    let caughtError: unknown = null;

    try {
      const images = await this.imageSource.load(command.inputDirectory);

      for (const image of images) {
        const reading = await this.predictImage(image, command.model);

        await this.outputWriter.write({
          type: 'prediction',
          ...reading.toJSON(),
        });
        await this.predictionCsvWriter.write(reading);
      }
    } catch (error) {
      caughtError = error;
      throw error;
    } finally {
      try {
        await this.predictionCsvWriter.close();
      } catch (closeError) {
        if (!caughtError) {
          throw closeError;
        }
      }
    }
  }

  private async predictImage(image: SourceImage, model: string): Promise<PredictedReading> {
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