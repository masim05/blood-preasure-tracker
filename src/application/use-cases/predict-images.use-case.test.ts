import { PredictImagesUseCase } from './predict-images.use-case';
import type { ImageMetadataPort } from '../ports/image-metadata.port';
import type { ImageSourcePort } from '../ports/image-source.port';
import type { LlmProviderPort } from '../ports/llm-provider.port';
import type { OutputWriterPort } from '../ports/output-writer.port';
import type { PredictionCsvWriterPort } from '../ports/prediction-csv-writer.port';
import {
  InMemoryMeasurementImageStore,
  InMemoryMeasurementStore,
  InMemoryRecognitionTaskStore,
} from '../../test-support/mobile-api-fakes';
import { SubmitMeasurementImageUseCase } from './submit-measurement-image.use-case';
import { ProcessRecognitionTaskUseCase } from './process-recognition-task.use-case';
import { jpegBytes } from '../../test-support/image-bytes';

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
    const predictionCsvWriter = createPredictionCsvWriter();

    const useCase = new PredictImagesUseCase(imageSource, imageMetadata, llmProvider, outputWriter, predictionCsvWriter);

    await useCase.execute({
      inputDirectory: 'data/eval',
      model: 'gpt-5.4-mini',
    });

    expect(imageSource.load).toHaveBeenCalledWith('data/eval');
    expect(predictionCsvWriter.open).toHaveBeenCalledWith('data/eval');
    expect(imageMetadata.extractTimestamp).toHaveBeenCalledTimes(1);
    expect(llmProvider.infer).toHaveBeenCalledTimes(1);
    expect((imageMetadata.extractTimestamp as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      (llmProvider.infer as jest.Mock).mock.invocationCallOrder[0],
    );
    expect(outputWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        time: '2026-05-20 14:01:23',
        hand: 'right',
        status: 'complete',
        uncertainFields: [],
      }),
    );
    expect(predictionCsvWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        imageId: 'img001',
        status: 'complete',
      }),
    );
    expect(predictionCsvWriter.close).toHaveBeenCalledTimes(1);
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
    const predictionCsvWriter = createPredictionCsvWriter();

    const useCase = new PredictImagesUseCase(imageSource, imageMetadata, llmProvider, outputWriter, predictionCsvWriter);

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
    expect(predictionCsvWriter.write).toHaveBeenCalledWith(
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
      extractTimestamp: jest
        .fn()
        .mockResolvedValueOnce({
          imageId: 'img001',
          imagePath: 'data/eval/img001.jpg',
          time: null,
          sourceTag: null,
          rawValue: null,
          issues: ['No supported embedded timestamp metadata found'],
        })
        .mockResolvedValueOnce({
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
    const predictionCsvWriter = createPredictionCsvWriter();
    const useCase = new PredictImagesUseCase(imageSource, imageMetadata, llmProvider, outputWriter, predictionCsvWriter);

    await useCase.execute({
      inputDirectory: 'data/eval',
      model: 'gpt-5.4-mini',
    });

    expect(outputWriter.write).toHaveBeenCalledTimes(2);
    expect(outputWriter.write).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        imageId: 'img001',
        time: null,
        status: 'error',
        uncertainFields: ['time'],
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
    expect(predictionCsvWriter.write).toHaveBeenCalledTimes(2);
    expect(predictionCsvWriter.write).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        imageId: 'img001',
        status: 'error',
      }),
    );
    expect(predictionCsvWriter.write).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        imageId: 'img002',
        status: 'complete',
      }),
    );
    expect(predictionCsvWriter.close).toHaveBeenCalledTimes(1);
  });

  it('preserves metadata time when provider inference fails', async () => {
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
      infer: jest.fn().mockRejectedValue(new Error('provider failed')),
    };
    const outputWriter: OutputWriterPort = {
      write: jest.fn().mockResolvedValue(undefined),
    };
    const predictionCsvWriter = createPredictionCsvWriter();
    const useCase = new PredictImagesUseCase(imageSource, imageMetadata, llmProvider, outputWriter, predictionCsvWriter);

    await useCase.execute({
      inputDirectory: 'data/eval',
      model: 'gpt-5.4-mini',
    });

    expect(outputWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        time: '2026-05-20 14:01:23',
        status: 'error',
        uncertainFields: [],
      }),
    );
  });

  it('creates and closes a CSV artifact even when the input directory has no images', async () => {
    const imageSource: ImageSourcePort = {
      load: jest.fn().mockResolvedValue([]),
    };
    const imageMetadata: ImageMetadataPort = {
      extractTimestamp: jest.fn(),
    };
    const llmProvider: LlmProviderPort = {
      provider: 'openai',
      infer: jest.fn(),
    };
    const outputWriter: OutputWriterPort = {
      write: jest.fn().mockResolvedValue(undefined),
    };
    const predictionCsvWriter = createPredictionCsvWriter();
    const useCase = new PredictImagesUseCase(imageSource, imageMetadata, llmProvider, outputWriter, predictionCsvWriter);

    await useCase.execute({
      inputDirectory: 'data/empty',
      model: 'gpt-5.4-mini',
    });

    expect(predictionCsvWriter.open).toHaveBeenCalledWith('data/empty');
    expect(predictionCsvWriter.write).not.toHaveBeenCalled();
    expect(predictionCsvWriter.close).toHaveBeenCalledTimes(1);
    expect(outputWriter.write).not.toHaveBeenCalled();
  });

  it('reports CSV open failures clearly before processing images', async () => {
    const imageSource: ImageSourcePort = {
      load: jest.fn().mockResolvedValue([]),
    };
    const imageMetadata: ImageMetadataPort = {
      extractTimestamp: jest.fn(),
    };
    const llmProvider: LlmProviderPort = {
      provider: 'openai',
      infer: jest.fn(),
    };
    const outputWriter: OutputWriterPort = {
      write: jest.fn().mockResolvedValue(undefined),
    };
    const predictionCsvWriter = createPredictionCsvWriter({
      open: jest.fn().mockRejectedValue(new Error('Failed to write prediction CSV at data/eval/p.csv: denied')),
    });
    const useCase = new PredictImagesUseCase(imageSource, imageMetadata, llmProvider, outputWriter, predictionCsvWriter);

    await expect(
      useCase.execute({
        inputDirectory: 'data/eval',
        model: 'gpt-5.4-mini',
      }),
    ).rejects.toThrow('Failed to write prediction CSV at data/eval/p.csv: denied');

    expect(imageSource.load).not.toHaveBeenCalled();
    expect(predictionCsvWriter.close).not.toHaveBeenCalled();
  });

  it('does not close when CSV open fails after partial allocation', async () => {
    const imageSource: ImageSourcePort = {
      load: jest.fn().mockResolvedValue([]),
    };
    const imageMetadata: ImageMetadataPort = {
      extractTimestamp: jest.fn(),
    };
    const llmProvider: LlmProviderPort = {
      provider: 'openai',
      infer: jest.fn(),
    };
    const outputWriter: OutputWriterPort = {
      write: jest.fn().mockResolvedValue(undefined),
    };
    const predictionCsvWriter = createPredictionCsvWriter({
      open: jest.fn().mockRejectedValue(new Error('Failed to write prediction CSV at data/eval/p.csv: header failed')),
    });
    const useCase = new PredictImagesUseCase(imageSource, imageMetadata, llmProvider, outputWriter, predictionCsvWriter);

    await expect(
      useCase.execute({
        inputDirectory: 'data/eval',
        model: 'gpt-5.4-mini',
      }),
    ).rejects.toThrow('Failed to write prediction CSV at data/eval/p.csv: header failed');

    expect(predictionCsvWriter.close).not.toHaveBeenCalled();
  });

  it('keeps JSONL output before CSV row writing for existing consumers', async () => {
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
    const predictionCsvWriter = createPredictionCsvWriter();
    const useCase = new PredictImagesUseCase(imageSource, imageMetadata, llmProvider, outputWriter, predictionCsvWriter);

    await useCase.execute({
      inputDirectory: 'data/eval',
      model: 'gpt-5.4-mini',
    });

    expect((outputWriter.write as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
      (predictionCsvWriter.write as jest.Mock).mock.invocationCallOrder[0],
    );
    expect(outputWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'prediction',
        imageId: 'img001',
        imagePath: 'data/eval/img001.jpg',
      }),
    );
  });

  it('propagates close failures when processing otherwise succeeds', async () => {
    const imageSource: ImageSourcePort = {
      load: jest.fn().mockResolvedValue([]),
    };
    const imageMetadata: ImageMetadataPort = {
      extractTimestamp: jest.fn(),
    };
    const llmProvider: LlmProviderPort = {
      provider: 'openai',
      infer: jest.fn(),
    };
    const outputWriter: OutputWriterPort = {
      write: jest.fn().mockResolvedValue(undefined),
    };
    const predictionCsvWriter = createPredictionCsvWriter({
      close: jest.fn().mockRejectedValue(new Error('close failed')),
    });
    const useCase = new PredictImagesUseCase(imageSource, imageMetadata, llmProvider, outputWriter, predictionCsvWriter);

    await expect(
      useCase.execute({
        inputDirectory: 'data/empty',
        model: 'gpt-5.4-mini',
      }),
    ).rejects.toThrow('close failed');
  });

  it('preserves the primary processing error when close also fails', async () => {
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
      write: jest.fn().mockRejectedValue(new Error('stdout failed')),
    };
    const predictionCsvWriter = createPredictionCsvWriter({
      close: jest.fn().mockRejectedValue(new Error('close failed')),
    });
    const useCase = new PredictImagesUseCase(imageSource, imageMetadata, llmProvider, outputWriter, predictionCsvWriter);

    await expect(
      useCase.execute({
        inputDirectory: 'data/eval',
        model: 'gpt-5.4-mini',
      }),
    ).rejects.toThrow('stdout failed');

    expect(predictionCsvWriter.write).not.toHaveBeenCalled();
  });

  it('emits an error row when metadata extraction fails', async () => {
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
      extractTimestamp: jest.fn().mockRejectedValue(new Error('metadata failed')),
    };
    const llmProvider: LlmProviderPort = {
      provider: 'openai',
      infer: jest.fn(),
    };
    const outputWriter: OutputWriterPort = {
      write: jest.fn().mockResolvedValue(undefined),
    };
    const predictionCsvWriter = createPredictionCsvWriter();
    const useCase = new PredictImagesUseCase(imageSource, imageMetadata, llmProvider, outputWriter, predictionCsvWriter);

    await useCase.execute({
      inputDirectory: 'data/eval',
      model: 'gpt-5.4-mini',
    });

    expect(llmProvider.infer).not.toHaveBeenCalled();
    expect(outputWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        imageId: 'img001',
        status: 'error',
        uncertainFields: ['time'],
        rawNotes: 'metadata failed',
      }),
    );
    expect(predictionCsvWriter.write).toHaveBeenCalledWith(
      expect.objectContaining({
        imageId: 'img001',
        status: 'error',
      }),
    );
  });

  it('matches worker recognition values with predict flow outputs', async () => {
    const imageSource: ImageSourcePort = {
      load: jest.fn().mockResolvedValue([
        {
          imageId: 'img001',
          imagePath: 'data/eval/img001.jpg',
          contentType: 'image/jpeg',
          data: jpegBytes,
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
        systolic: 126,
        diastolic: 79,
        pulse: 68,
        confidence: 0.95,
        uncertainFields: [],
        rawNotes: null,
      }),
    };
    const outputWriter: OutputWriterPort = {
      write: jest.fn().mockResolvedValue(undefined),
    };
    const predictionCsvWriter = createPredictionCsvWriter();

    await new PredictImagesUseCase(
      imageSource,
      imageMetadata,
      llmProvider,
      outputWriter,
      predictionCsvWriter,
    ).execute({ inputDirectory: 'data/eval', model: 'gpt-5.4-mini' });

    const predicted = (outputWriter.write as jest.Mock).mock.calls[0][0] as {
      systolic: number;
      diastolic: number;
      pulse: number;
      hand: 'left' | 'right' | 'unknown';
    };

    const measurements = new InMemoryMeasurementStore();
    const images = new InMemoryMeasurementImageStore();
    const tasks = new InMemoryRecognitionTaskStore();
    const now = new Date('2026-05-30T10:00:00.000Z');
    await new SubmitMeasurementImageUseCase(measurements, images, tasks).execute({
      userId: 'usr_1',
      contentType: 'image/jpeg',
      originalName: 'bp.jpg',
      data: jpegBytes,
      now,
    });
    const taskId = [...tasks.tasks.keys()][0];
    await new ProcessRecognitionTaskUseCase(tasks, measurements, images, llmProvider).execute({
      taskId,
      model: 'gpt-5.4-mini',
      now,
    });

    const recognized = [...measurements.measurements.values()][0];
    expect(recognized.systolic).toBe(predicted.systolic);
    expect(recognized.diastolic).toBe(predicted.diastolic);
    expect(recognized.pulse).toBe(predicted.pulse);
    expect(recognized.armSide).toBe(predicted.hand);
  });
});

function createPredictionCsvWriter(
  overrides: Partial<PredictionCsvWriterPort> = {},
): jest.Mocked<PredictionCsvWriterPort> {
  return {
    open: jest.fn().mockResolvedValue(undefined),
    write: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as jest.Mocked<PredictionCsvWriterPort>;
}
