import { ModelRegistry } from '../../../src/adapters/outbound/llm/model-registry';

describe('ModelRegistry', () => {
  it('returns statically configured model catalogs for installed adapters', () => {
    const registry = new ModelRegistry();

    expect(registry.list()).toEqual([
      {
        provider: 'openai',
        models: ['gpt-5.4-mini'],
        defaultModel: 'gpt-5.4-mini',
        available: true,
      },
    ]);
  });

  it('returns the default model for a provider', () => {
    const registry = new ModelRegistry();

    expect(registry.getDefaultModel('openai')).toBe('gpt-5.4-mini');
  });

  it('fails when a provider catalog is not configured', () => {
    const registry = new ModelRegistry();

    expect(() => registry.getDefaultModel('missing')).toThrow('No model catalog configured');
  });
});