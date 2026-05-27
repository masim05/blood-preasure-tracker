import { PredictedReading } from './predicted-reading';

const baseReading = {
  imageId: 'img001',
  imagePath: 'data/eval/img001.jpg',
  time: '2026-05-20 14:01:23 GMT+7',
  hand: 'right' as const,
  systolic: 127,
  diastolic: 72,
  pulse: 69,
  confidence: 0.95,
  status: 'complete' as const,
  uncertainFields: [],
  provider: 'openai',
  model: 'gpt-5.4-mini',
  rawNotes: null,
};

describe('PredictedReading', () => {
  it('serializes a valid reading', () => {
    const reading = new PredictedReading(baseReading);

    expect(reading.toJSON()).toEqual(baseReading);
  });

  it('fails when imageId is missing', () => {
    expect(() => new PredictedReading({ ...baseReading, imageId: '' })).toThrow(
      'PredictedReading.imageId is required',
    );
  });

  it('fails when imagePath is missing', () => {
    expect(() => new PredictedReading({ ...baseReading, imagePath: '' })).toThrow(
      'PredictedReading.imagePath is required',
    );
  });

  it('fails when confidence is out of range', () => {
    expect(() => new PredictedReading({ ...baseReading, confidence: 1.5 })).toThrow(
      'PredictedReading.confidence must be between 0 and 1',
    );
  });

  it('fails when complete status includes uncertain fields', () => {
    expect(() =>
      new PredictedReading({ ...baseReading, uncertainFields: ['pulse'] }),
    ).toThrow('PredictedReading.complete status cannot include uncertain fields');
  });

  it('fails when partial status has no uncertain fields', () => {
    expect(() =>
      new PredictedReading({ ...baseReading, status: 'partial', uncertainFields: [] }),
    ).toThrow('PredictedReading.partial status requires uncertain fields');
  });

  it('fails when unreadable status still includes readable values', () => {
    expect(() =>
      new PredictedReading({
        ...baseReading,
        status: 'unreadable',
        uncertainFields: ['systolic'],
      }),
    ).toThrow('PredictedReading.unreadable status cannot include medical values');
  });

  it('allows unreadable status when all medical values are null', () => {
    expect(
      () =>
        new PredictedReading({
          ...baseReading,
          time: null,
          hand: null,
          systolic: null,
          diastolic: null,
          pulse: null,
          confidence: null,
          status: 'unreadable',
          uncertainFields: ['time'],
        }),
    ).not.toThrow();
  });

  it('allows partial status when only metadata time is uncertain', () => {
    expect(
      () =>
        new PredictedReading({
          ...baseReading,
          time: null,
          status: 'partial',
          uncertainFields: ['time'],
        }),
    ).not.toThrow();
  });
});