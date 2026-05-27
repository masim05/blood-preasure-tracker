import { EvaluationMatcher } from './evaluation-matcher';

describe('EvaluationMatcher', () => {
  it('matches predictions and ground truth by imageId filename stem', () => {
    const matcher = new EvaluationMatcher();

    const comparisons = matcher.match(
      [
        {
          imageId: 'img001',
          imagePath: 'data/eval/img001.jpg',
          time: '2026-05-20 14:01:23 GMT+7',
          hand: 'right',
          systolic: 127,
          diastolic: 72,
          pulse: 69,
          confidence: 0.95,
          status: 'complete',
          uncertainFields: [],
          provider: 'openai',
          model: 'gpt-5.4-mini',
          rawNotes: null,
        },
      ],
      [
        {
          imageId: 'img001',
          time: '2026-05-20 14:01:23 GMT+7',
          hand: 'right',
          systolic: 127,
          diastolic: 72,
          pulse: 69,
        },
      ],
    );

    expect(comparisons).toHaveLength(1);
    expect(comparisons[0]?.matchStatus).toBe('matched');
  });

  it('fails when predictions normalize to duplicate filename stems', () => {
    const matcher = new EvaluationMatcher();

    expect(() =>
      matcher.match(
        [
          {
            imageId: 'img001.jpg',
            imagePath: 'data/eval/img001.jpg',
            time: '2026-05-20 14:01:23 GMT+7',
            hand: 'right',
            systolic: 127,
            diastolic: 72,
            pulse: 69,
            confidence: 0.95,
            status: 'complete',
            uncertainFields: [],
            provider: 'openai',
            model: 'gpt-5.4-mini',
            rawNotes: null,
          },
          {
            imageId: 'img001',
            imagePath: 'data/eval/img001.png',
            time: '2026-05-20 14:01:23 GMT+7',
            hand: 'right',
            systolic: 127,
            diastolic: 72,
            pulse: 69,
            confidence: 0.95,
            status: 'complete',
            uncertainFields: [],
            provider: 'openai',
            model: 'gpt-5.4-mini',
            rawNotes: null,
          },
        ],
        [],
      ),
    ).toThrow('Duplicate filename stem');
  });

  it('marks predictions without ground truth as ground-truth-missing', () => {
    const matcher = new EvaluationMatcher();

    const comparisons = matcher.match(
      [
        {
          imageId: 'img001',
          imagePath: 'data/eval/img001.jpg',
          time: '2026-05-20 14:01:23 GMT+7',
          hand: 'right',
          systolic: 127,
          diastolic: 72,
          pulse: 69,
          confidence: 0.95,
          status: 'complete',
          uncertainFields: [],
          provider: 'openai',
          model: 'gpt-5.4-mini',
          rawNotes: null,
        },
      ],
      [],
    );

    expect(comparisons[0]?.matchStatus).toBe('ground-truth-missing');
  });

  it('marks ground truth rows without predictions as prediction-missing', () => {
    const matcher = new EvaluationMatcher();

    const comparisons = matcher.match([], [
      {
        imageId: 'img001',
        time: '2026-05-20 14:01:23 GMT+7',
        hand: 'right',
        systolic: 127,
        diastolic: 72,
        pulse: 69,
      },
    ]);

    expect(comparisons[0]?.matchStatus).toBe('prediction-missing');
  });

  it('fails when ground truth rows normalize to duplicate filename stems', () => {
    const matcher = new EvaluationMatcher();

    expect(() =>
      matcher.match([], [
        {
          imageId: 'img001.jpg',
          time: '2026-05-20 14:01:23 GMT+7',
          hand: 'right',
          systolic: 127,
          diastolic: 72,
          pulse: 69,
        },
        {
          imageId: 'img001',
          time: '2026-05-20 14:01:23 GMT+7',
          hand: 'right',
          systolic: 127,
          diastolic: 72,
          pulse: 69,
        },
      ]),
    ).toThrow('Duplicate filename stem');
  });

  it('marks differing values as mismatches', () => {
    const matcher = new EvaluationMatcher();

    const comparisons = matcher.match(
      [
        {
          imageId: 'img001',
          imagePath: 'data/eval/img001.jpg',
          time: '2026-05-20 14:01:23 GMT+7',
          hand: 'right',
          systolic: 127,
          diastolic: 72,
          pulse: 69,
          confidence: 0.95,
          status: 'complete',
          uncertainFields: [],
          provider: 'openai',
          model: 'gpt-5.4-mini',
          rawNotes: null,
        },
      ],
      [
        {
          imageId: 'img001',
          time: '2026-05-20 14:01:23 GMT+7',
          hand: 'right',
          systolic: 128,
          diastolic: 72,
          pulse: 69,
        },
      ],
    );

    expect(comparisons[0]?.matchStatus).toBe('mismatch');
    expect(comparisons[0]?.fieldResults.systolic).toBe('mismatch');
  });

  it('matches normalized metadata timestamps exactly', () => {
    const matcher = new EvaluationMatcher();

    const comparisons = matcher.match(
      [
        {
          imageId: '2026-05-19 06-05-20.JPG',
          imagePath: 'data/eval/2026-05-19 06-05-20.JPG',
          time: '2026-05-19 06:05:20',
          hand: 'left',
          systolic: 121,
          diastolic: 75,
          pulse: 75,
          confidence: 0.98,
          status: 'complete',
          uncertainFields: [],
          provider: 'openai',
          model: 'gpt-5.4-mini',
          rawNotes: null,
        },
      ],
      [
        {
          imageId: '2026-05-19 06-05-20',
          time: '2026-05-19 06:05:20',
          hand: 'left',
          systolic: 121,
          diastolic: 75,
          pulse: 75,
        },
      ],
    );

    expect(comparisons[0]?.matchStatus).toBe('matched');
    expect(comparisons[0]?.fieldResults.time).toBe('match');
  });

  it('accepts class instances and marks null field values as missing', () => {
    const matcher = new EvaluationMatcher();

    const comparisons = matcher.match(
      [
        {
          toJSON: () => ({
            imageId: 'img001',
            imagePath: 'data/eval/img001.jpg',
            time: null,
            hand: 'right',
            systolic: 127,
            diastolic: 72,
            pulse: 69,
            confidence: 0.95,
            status: 'complete',
            uncertainFields: [],
            provider: 'openai',
            model: 'gpt-5.4-mini',
            rawNotes: null,
          }),
        },
      ] as never,
      [
        {
          toJSON: () => ({
            imageId: 'img001',
            time: '2026-05-20 14:01:23 GMT+7',
            hand: 'right',
            systolic: 127,
            diastolic: 72,
            pulse: 69,
          }),
        },
      ] as never,
    );

    expect(comparisons[0]?.fieldResults.time).toBe('missing');
  });
});