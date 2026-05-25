import type { ImageSourcePort } from '../ports/image-source.port';
import type { ImageMetadataPort } from '../ports/image-metadata.port';
import type { LlmProviderPort } from '../ports/llm-provider.port';
import type { OutputWriterPort } from '../ports/output-writer.port';
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
  ) {}

  async execute(command: PredictImagesCommand): Promise<void> {
    const images = await this.imageSource.load(command.inputDirectory);

    for (const image of images) {
      const inference = await this.llmProvider.infer({
        imageId: image.imageId,
        imagePath: image.imagePath,
        contentType: image.contentType,
        data: image.data,
        model: command.model,
      });
      const metadata = await this.imageMetadata.extractTimestamp({
        imageId: image.imageId,
        imagePath: image.imagePath,
        data: image.data,
      });
      const uncertainFields = metadata.time === null
        ? [...new Set([...inference.uncertainFields, 'time'])]
        : [...inference.uncertainFields];

      const reading = new PredictedReading({
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
        model: command.model,
        rawNotes: inference.rawNotes,
      });

      await this.outputWriter.write({
        type: 'prediction',
        ...reading.toJSON(),
      });
    }
  }
}