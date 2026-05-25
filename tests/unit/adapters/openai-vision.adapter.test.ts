import { OpenAiVisionAdapter } from '../../../src/adapters/outbound/llm/openai-vision.adapter';

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

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        text: expect.objectContaining({
          format: expect.objectContaining({
            schema: expect.objectContaining({
              properties: expect.not.objectContaining({ time: expect.anything() }),
              required: expect.not.arrayContaining(['time']),
            }),
          }),
        }),
      }),
    );
  });
});