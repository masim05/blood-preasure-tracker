import type { ImageSourcePort } from '../ports/image-source.port';
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

      const reading = new PredictedReading({
        imageId: image.imageId,
        imagePath: image.imagePath,
        time: inference.time,
        hand: inference.hand,
        systolic: inference.systolic,
        diastolic: inference.diastolic,
        pulse: inference.pulse,
        confidence: inference.confidence,
        status: deriveReadingStatus({
          time: inference.time,
          hand: inference.hand,
          systolic: inference.systolic,
          diastolic: inference.diastolic,
          pulse: inference.pulse,
          uncertainFields: inference.uncertainFields,
        }),
        uncertainFields: inference.uncertainFields,
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