import { EvaluateImagesUseCase } from './evaluate-images.use-case';
import type { EvaluationDatasetPort } from '../ports/evaluation-dataset.port';
import type { ImageMetadataPort } from '../ports/image-metadata.port';
import type { ImageSourcePort } from '../ports/image-source.port';
import type { LlmProviderPort } from '../ports/llm-provider.port';
import type { OutputWriterPort } from '../ports/output-writer.port';

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
          time: '2026-05-20 14:01:23',
          hand: 'right',
          systolic: 127,
          diastolic: 72,
          pulse: 69,
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
      writeText: jest.fn().mockResolvedValue(undefined),
    };

    const useCase = new EvaluateImagesUseCase(
      imageSource,
      dataset,
      imageMetadata,
      llmProvider,
      outputWriter,
    );

    await useCase.execute({
      inputDirectory: 'data/eval',
      evaluationCsvPath: 'data/eval/a.csv',
      model: 'gpt-5.4-mini',
    });

    expect(outputWriter.write).toHaveBeenCalledTimes(2);
    expect(outputWriter.writeText).toHaveBeenCalledWith([
      'hand:             1/1 (100.0%)',
      'systolic:         1/1 (100.0%)',
      'diastolic:        1/1 (100.0%)',
      'pulse:            1/1 (100.0%)',
      '2 params correct: 1/1 (100.0%)',
      '3 params correct: 1/1 (100.0%)',
      '4 params correct: 1/1 (100.0%)',
      '',
    ].join('\n'));
    expect(outputWriter.write).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        fieldResults: expect.objectContaining({ time: 'match' }),
        matchStatus: 'matched',
      }),
    );
  });

  it('records an error prediction and still writes a summary when one image fails', async () => {
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
    const dataset: EvaluationDatasetPort = {
      load: jest.fn().mockResolvedValue([
        {
          imageId: 'img001',
          time: '2026-05-20 14:01:23',
          hand: 'right',
          systolic: 127,
          diastolic: 72,
          pulse: 69,
        },
        {
          imageId: 'img002',
          time: '2026-05-20 14:02:23',
          hand: 'right',
          systolic: 128,
          diastolic: 73,
          pulse: 70,
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
          time: '2026-05-20 14:02:23',
          sourceTag: 'DateTimeOriginal',
          rawValue: '2026:05:20 14:02:23',
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
          systolic: 128,
          diastolic: 73,
          pulse: 70,
          confidence: 0.95,
          uncertainFields: [],
          rawNotes: null,
        }),
    };
    const outputWriter: OutputWriterPort = {
      write: jest.fn().mockResolvedValue(undefined),
      writeText: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new EvaluateImagesUseCase(
      imageSource,
      dataset,
      imageMetadata,
      llmProvider,
      outputWriter,
    );

    await useCase.execute({
      inputDirectory: 'data/eval',
      evaluationCsvPath: 'data/eval/a.csv',
      model: 'gpt-5.4-mini',
    });

    expect(outputWriter.write).toHaveBeenCalledTimes(3);
    expect(outputWriter.write).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        prediction: expect.objectContaining({
          time: null,
          status: 'error',
          uncertainFields: ['time'],
          rawNotes: 'provider failed',
        }),
        matchStatus: 'mismatch',
      }),
    );
    expect(outputWriter.write).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        type: 'summary',
        errorCount: 1,
        matchedRecords: 1,
      }),
    );
    expect(outputWriter.writeText).toHaveBeenCalledTimes(1);
  });

  it('preserves metadata time in error comparisons when provider inference fails', async () => {
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
          time: '2026-05-20 14:01:23',
          hand: 'right',
          systolic: 127,
          diastolic: 72,
          pulse: 69,
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
      writeText: jest.fn().mockResolvedValue(undefined),
    };
    const useCase = new EvaluateImagesUseCase(
      imageSource,
      dataset,
      imageMetadata,
      llmProvider,
      outputWriter,
    );

    await useCase.execute({
      inputDirectory: 'data/eval',
      evaluationCsvPath: 'data/eval/a.csv',
      model: 'gpt-5.4-mini',
    });

    expect(outputWriter.write).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        prediction: expect.objectContaining({
          time: '2026-05-20 14:01:23',
          status: 'error',
          uncertainFields: [],
        }),
      }),
    );
  });

  it('writes comparison records, summary record, and accuracy text in order', async () => {
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
          time: '2026-05-20 14:01:23',
          hand: 'left',
          systolic: 127,
          diastolic: 70,
          pulse: 69,
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
    const callOrder: string[] = [];
    const outputWriter: OutputWriterPort = {
      write: jest.fn().mockImplementation(async (record: { type: string }) => {
        callOrder.push(record.type);
      }),
      writeText: jest.fn().mockImplementation(async () => {
        callOrder.push('text');
      }),
    };
    const useCase = new EvaluateImagesUseCase(
      imageSource,
      dataset,
      imageMetadata,
      llmProvider,
      outputWriter,
    );

    await useCase.execute({
      inputDirectory: 'data/eval',
      evaluationCsvPath: 'data/eval/a.csv',
      model: 'gpt-5.4-mini',
    });

    expect(callOrder).toEqual(['comparison', 'summary', 'text']);
    expect(outputWriter.writeText).toHaveBeenCalledWith(expect.stringContaining('hand:             0/1 (  0.0%)'));
  });
});
