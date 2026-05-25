import { PredictImagesUseCase } from '../../../src/application/use-cases/predict-images.use-case';
import type { ImageMetadataPort } from '../../../src/application/ports/image-metadata.port';
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
    const imageMetadata: ImageMetadataPort = {
      extractTimestamp: jest.fn().mockResolvedValue({
        imageId: 'img001',
        imagePath: 'data/eval/img001.jpg',
        time: '2026-05-20 14:01:23',
        sourceTag: 'DateTimeOriginal',
        rawValue: '2026:05:20 14:01:23',
        issues: [],
      }),
    };
    const llmProvider: LlmProviderPort = {
      provider: 'openai',
      infer: jest.fn().mockResolvedValue({
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

    const useCase = new PredictImagesUseCase(imageSource, imageMetadata, llmProvider, outputWriter);

    await useCase.execute({
      inputDirectory: 'data/eval',
      model: 'gpt-5.4-mini',
    });

    expect(imageSource.load).toHaveBeenCalledWith('data/eval');
    expect(imageMetadata.extractTimestamp).toHaveBeenCalledTimes(1);
    expect(llmProvider.infer).toHaveBeenCalledTimes(1);
    expect(outputWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        time: '2026-05-20 14:01:23',
        hand: 'right',
        status: 'complete',
        uncertainFields: [],
      }),
    );
  });

  it('keeps null metadata time uncertain without provider fallback', async () => {
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
    const imageMetadata: ImageMetadataPort = {
      extractTimestamp: jest.fn().mockResolvedValue({
        imageId: 'img001',
        imagePath: 'data/eval/img001.jpg',
        time: null,
        sourceTag: null,
        rawValue: null,
        issues: ['No supported embedded timestamp metadata found'],
      }),
    };
    const llmProvider: LlmProviderPort = {
      provider: 'openai',
      infer: jest.fn().mockResolvedValue({
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

    const useCase = new PredictImagesUseCase(imageSource, imageMetadata, llmProvider, outputWriter);

    await useCase.execute({
      inputDirectory: 'data/eval',
      model: 'gpt-5.4-mini',
    });

    expect(outputWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        time: null,
        status: 'partial',
        uncertainFields: ['time'],
      }),
    );
  });

  it('emits an error prediction and continues when one image fails', async () => {
    const imageSource: ImageSourcePort = {
      load: jest.fn().mockResolvedValue([
        {
          imageId: 'img001',
          imagePath: 'data/eval/img001.jpg',
          contentType: 'image/jpeg',
          data: Buffer.from('first'),
        },
        {
          imageId: 'img002',
          imagePath: 'data/eval/img002.jpg',
          contentType: 'image/jpeg',
          data: Buffer.from('second'),
        },
      ]),
    };
    const imageMetadata: ImageMetadataPort = {
      extractTimestamp: jest.fn().mockResolvedValue({
        imageId: 'img002',
        imagePath: 'data/eval/img002.jpg',
        time: '2026-05-20 14:01:23',
        sourceTag: 'DateTimeOriginal',
        rawValue: '2026:05:20 14:01:23',
        issues: [],
      }),
    };
    const llmProvider: LlmProviderPort = {
      provider: 'openai',
      infer: jest
        .fn()
        .mockRejectedValueOnce(new Error('provider failed'))
        .mockResolvedValueOnce({
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
    const useCase = new PredictImagesUseCase(imageSource, imageMetadata, llmProvider, outputWriter);

    await useCase.execute({
      inputDirectory: 'data/eval',
      model: 'gpt-5.4-mini',
    });

    expect(outputWriter.write).toHaveBeenCalledTimes(2);
    expect(outputWriter.write).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        imageId: 'img001',
        status: 'error',
        rawNotes: 'provider failed',
      }),
    );
    expect(outputWriter.write).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        imageId: 'img002',
        status: 'complete',
      }),
    );
  });
});