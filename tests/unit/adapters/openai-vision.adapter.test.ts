import { OpenAiVisionAdapter } from '../../../src/adapters/outbound/llm/openai-vision.adapter';

describe('OpenAiVisionAdapter', () => {
  it('normalizes unsupported hand values to null', async () => {
    const create = jest.fn().mockResolvedValue({
      output_text: JSON.stringify({
        time: '2026-05-20 14:01:23 GMT+7',
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
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-5.4-mini',
      }),
    );
  });
});