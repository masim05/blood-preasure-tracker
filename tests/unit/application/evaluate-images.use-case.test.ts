import { EvaluateImagesUseCase } from '../../../src/application/use-cases/evaluate-images.use-case';
import type { EvaluationDatasetPort } from '../../../src/application/ports/evaluation-dataset.port';
import type { ImageSourcePort } from '../../../src/application/ports/image-source.port';
import type { LlmProviderPort } from '../../../src/application/ports/llm-provider.port';
import type { OutputWriterPort } from '../../../src/application/ports/output-writer.port';

describe('EvaluateImagesUseCase', () => {
  it('writes comparison records and a final summary record', async () => {
    const imageSource: ImageSourcePort = {
      load: jest.fn().mockResolvedValue([
        {
          imageId: 'img001',
          imagePath: 'data/eval/img001.jpg',
          contentType: 'image/jpeg',
          data: Buffer.from('test'),
        },
      ]),
    };
    const dataset: EvaluationDatasetPort = {
      load: jest.fn().mockResolvedValue([
        {
          imageId: 'img001',
          time: '2026-05-20 14:01:23 GMT+7',
          hand: 'right',
          systolic: 127,
          diastolic: 72,
          pulse: 69,
        },
      ]),
    };
    const llmProvider: LlmProviderPort = {
      provider: 'openai',
      infer: jest.fn().mockResolvedValue({
        time: '2026-05-20 14:01:23 GMT+7',
        hand: 'right',
        systolic: 127,
        diastolic: 72,
        pulse: 69,
        confidence: 0.95,
        uncertainFields: [],
        rawNotes: null,
      }),
    };
    const outputWriter: OutputWriterPort = {
      write: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new EvaluateImagesUseCase(imageSource, dataset, llmProvider, outputWriter);

    await useCase.execute({
      inputDirectory: 'data/eval',
      evaluationCsvPath: 'data/eval/a.csv',
      model: 'gpt-5.4-mini',
    });

    expect(outputWriter.write).toHaveBeenCalledTimes(2);
  });
});