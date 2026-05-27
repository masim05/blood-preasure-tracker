import { OpenAiVisionAdapter } from './openai-vision.adapter';

describe('OpenAiVisionAdapter', () => {
  it('normalizes unsupported hand values to null', async () => {
    const create = jest.fn().mockResolvedValue({
      output_text: JSON.stringify({
        hand: 'center',
        systolic: 127,
        diastolic: 72,
        pulse: 69,
        confidence: 0.95,
        uncertainFields: [],
        rawNotes: null,
      }),
    });
    const adapter = new OpenAiVisionAdapter({
      apiKey: 'test-key',
      model: 'gpt-5.4-mini',
      client: { responses: { create } } as never,
    });

    const response = await adapter.infer({
      imageId: 'img001',
      imagePath: 'data/eval/img001.jpg',
      contentType: 'image/jpeg',
      data: Buffer.from('fixture-image'),
      model: '',
    });

    expect(response.hand).toBeNull();
    expect(response).not.toHaveProperty('time');
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.4-mini',
      }),
    );
  });

  it('does not request time in the provider response schema', async () => {
    const create = jest.fn().mockResolvedValue({
      output_text: JSON.stringify({
        hand: 'left',
        systolic: 121,
        diastolic: 75,
        pulse: 75,
        confidence: 0.98,
        uncertainFields: [],
        rawNotes: null,
      }),
    });
    const adapter = new OpenAiVisionAdapter({
      apiKey: 'test-key',
      model: 'gpt-5.4-mini',
      client: { responses: { create } } as never,
    });

    await adapter.infer({
      imageId: 'img001',
      imagePath: 'data/eval/img001.jpg',
      contentType: 'image/jpeg',
      data: Buffer.from('fixture-image'),
      model: '',
    });

    const request = create.mock.calls[0]?.[0] as {
      text: { format: { schema: { properties: Record<string, unknown>; required: string[] } } };
    };
    const schema = request.text.format.schema;

    expect(schema.properties).toEqual(
      expect.objectContaining({
        hand: { enum: ['left', 'right', 'unknown', null] },
      }),
    );
    expect(schema.properties).not.toHaveProperty('time');
    expect(schema.required).not.toContain('time');
  });

  it('returns a safe uncertain response when provider output is not JSON', async () => {
    const create = jest.fn().mockResolvedValue({
      output_text: 'not-json',
    });
    const adapter = new OpenAiVisionAdapter({
      apiKey: 'test-key',
      model: 'gpt-5.4-mini',
      client: { responses: { create } } as never,
    });

    await expect(
      adapter.infer({
        imageId: 'img001',
        imagePath: 'data/eval/img001.jpg',
        contentType: 'image/jpeg',
        data: Buffer.from('fixture-image'),
        model: '',
      }),
    ).resolves.toEqual({
      hand: null,
      systolic: null,
      diastolic: null,
      pulse: null,
      confidence: null,
      uncertainFields: ['hand', 'systolic', 'diastolic', 'pulse'],
      rawNotes: expect.stringContaining('Unable to parse provider response'),
    });
  });

  it('defaults malformed provider fields to null and uncertain fields', async () => {
    const create = jest.fn().mockResolvedValue({
      output_text: JSON.stringify({
        hand: 42,
        systolic: 'bad',
        diastolic: null,
        pulse: null,
        confidence: null,
        uncertainFields: 'bad',
        rawNotes: 42,
      }),
    });
    const adapter = new OpenAiVisionAdapter({
      apiKey: 'test-key',
      model: 'gpt-5.4-mini',
      client: { responses: { create } } as never,
    });

    await expect(
      adapter.infer({
        imageId: 'img001',
        imagePath: 'data/eval/img001.jpg',
        contentType: 'image/jpeg',
        data: Buffer.from('fixture-image'),
        model: '',
      }),
    ).resolves.toMatchObject({
      hand: null,
      systolic: null,
      diastolic: null,
      pulse: null,
      confidence: null,
      uncertainFields: ['hand', 'systolic', 'diastolic', 'pulse'],
      rawNotes: null,
    });
  });

  it('keeps only provider-owned uncertain fields from model output', async () => {
    const create = jest.fn().mockResolvedValue({
      output_text: JSON.stringify({
        hand: 'left',
        systolic: 121,
        diastolic: 75,
        pulse: 75,
        confidence: 0.98,
        uncertainFields: ['hand', 'time', 'confidence', 'pulse'],
        rawNotes: null,
      }),
    });
    const adapter = new OpenAiVisionAdapter({
      apiKey: 'test-key',
      model: 'gpt-5.4-mini',
      client: { responses: { create } } as never,
    });

    await expect(
      adapter.infer({
        imageId: 'img001',
        imagePath: 'data/eval/img001.jpg',
        contentType: 'image/jpeg',
        data: Buffer.from('fixture-image'),
        model: '',
      }),
    ).resolves.toMatchObject({
      uncertainFields: ['hand', 'pulse'],
    });
  });

  it('defaults uncertain fields when model output includes only unsupported fields', async () => {
    const create = jest.fn().mockResolvedValue({
      output_text: JSON.stringify({
        hand: 'left',
        systolic: 121,
        diastolic: 75,
        pulse: 75,
        confidence: 0.98,
        uncertainFields: ['time', 'confidence'],
        rawNotes: null,
      }),
    });
    const adapter = new OpenAiVisionAdapter({
      apiKey: 'test-key',
      model: 'gpt-5.4-mini',
      client: { responses: { create } } as never,
    });

    await expect(
      adapter.infer({
        imageId: 'img001',
        imagePath: 'data/eval/img001.jpg',
        contentType: 'image/jpeg',
        data: Buffer.from('fixture-image'),
        model: '',
      }),
    ).resolves.toMatchObject({
      uncertainFields: ['hand', 'systolic', 'diastolic', 'pulse'],
    });
  });
});