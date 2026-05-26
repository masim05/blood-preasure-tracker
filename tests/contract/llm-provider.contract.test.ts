import type { LlmProviderPort } from '../../src/application/ports/llm-provider.port';

import { OpenAiVisionAdapter } from '../../src/adapters/outbound/llm/openai-vision.adapter';

describe('LlmProviderPort contract', () => {
  function expectProviderContract(provider: LlmProviderPort): void {
    expect(provider.provider).toBe('openai');
    expect(typeof provider.infer).toBe('function');
  }

  it('exposes the expected provider contract for the OpenAI adapter', () => {
    const provider = new OpenAiVisionAdapter({
      apiKey: 'test-key',
      model: 'gpt-5.4-mini',
    });

    expectProviderContract(provider);
  });
});