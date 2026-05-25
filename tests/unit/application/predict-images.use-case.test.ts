import { PredictImagesUseCase } from '../../../src/application/use-cases/predict-images.use-case';
import type { ImageSourcePort } from '../../../src/application/ports/image-source.port';
import type { LlmProviderPort } from '../../../src/application/ports/llm-provider.port';
import type { OutputWriterPort } from '../../../src/application/ports/output-writer.port';

describe('PredictImagesUseCase', () => {
  it('writes one prediction record per image using the selected provider and model', async () => {
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

    const useCase = new PredictImagesUseCase(imageSource, llmProvider, outputWriter);

    await useCase.execute({
      inputDirectory: 'data/eval',
      model: 'gpt-5.4-mini',
    });

    expect(imageSource.load).toHaveBeenCalledWith('data/eval');
    expect(llmProvider.infer).toHaveBeenCalledTimes(1);
    expect(outputWriter.write).toHaveBeenCalledTimes(1);
  });
});