import { deriveReadingStatus } from './uncertainty-policy';

describe('deriveReadingStatus', () => {
  it('returns complete when all tracked fields are present and certain', () => {
    expect(
      deriveReadingStatus({
        time: '2026-05-20 14:01:23 GMT+7',
        hand: 'right',
        systolic: 127,
        diastolic: 72,
        pulse: 69,
        uncertainFields: [],
      }),
    ).toBe('complete');
  });

  it('returns partial when some fields are present and some are uncertain', () => {
    expect(
      deriveReadingStatus({
        time: '2026-05-20 14:01:23 GMT+7',
        hand: 'right',
        systolic: 127,
        diastolic: null,
        pulse: 69,
        uncertainFields: ['diastolic'],
      }),
    ).toBe('partial');
  });

  it('returns partial when vitals are present but metadata time is uncertain', () => {
    expect(
      deriveReadingStatus({
        time: null,
        hand: 'right',
        systolic: 127,
        diastolic: 72,
        pulse: 69,
        uncertainFields: ['time'],
      }),
    ).toBe('partial');
  });

  it('returns unreadable when nothing is readable and uncertainty is present', () => {
    expect(
      deriveReadingStatus({
        time: null,
        hand: null,
        systolic: null,
        diastolic: null,
        pulse: null,
        uncertainFields: ['time'],
      }),
    ).toBe('unreadable');
  });

  it('returns error when no values and no uncertainty are present', () => {
    expect(
      deriveReadingStatus({
        time: null,
        hand: null,
        systolic: null,
        diastolic: null,
        pulse: null,
        uncertainFields: [],
      }),
    ).toBe('error');
  });
});