import type { EvaluationDatasetPort } from '../ports/evaluation-dataset.port';
import type { ImageSourcePort } from '../ports/image-source.port';
import type { LlmProviderPort } from '../ports/llm-provider.port';
import type { OutputWriterPort } from '../ports/output-writer.port';
import { EvaluationReport } from '../../domain/entities/evaluation-report';
import { PredictedReading } from '../../domain/entities/predicted-reading';
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
    private readonly llmProvider: LlmProviderPort,
    private readonly outputWriter: OutputWriterPort,
    private readonly evaluationMatcher: EvaluationMatcher = new EvaluationMatcher(),
  ) {}

  async execute(command: EvaluateImagesCommand): Promise<void> {
    const images = await this.imageSource.load(command.inputDirectory);
    const groundTruthRows = await this.evaluationDataset.load(command.evaluationCsvPath);
    const predictions: PredictedReading[] = [];

    for (const image of images) {
      const inference = await this.llmProvider.infer({
        imageId: image.imageId,
        imagePath: image.imagePath,
        contentType: image.contentType,
        data: image.data,
        model: command.model,
      });

      predictions.push(
        new PredictedReading({
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
        }),
      );
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
  }
}