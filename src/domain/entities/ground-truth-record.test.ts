import { GroundTruthRecord } from './ground-truth-record';

describe('GroundTruthRecord', () => {
  it('serializes a valid ground-truth record', () => {
    const record = new GroundTruthRecord({
      imageId: 'img001',
      time: '2026-05-20 14:01:23 GMT+7',
      hand: 'right',
      systolic: 127,
      diastolic: 72,
      pulse: 69,
    });

    expect(record.toJSON()).toEqual({
      imageId: 'img001',
      time: '2026-05-20 14:01:23 GMT+7',
      hand: 'right',
      systolic: 127,
      diastolic: 72,
      pulse: 69,
    });
  });

  it('fails when imageId is missing', () => {
    expect(
      () =>
        new GroundTruthRecord({
          imageId: '',
          time: null,
          hand: null,
          systolic: null,
          diastolic: null,
          pulse: null,
        }),
    ).toThrow('GroundTruthRecord.imageId is required');
  });
});