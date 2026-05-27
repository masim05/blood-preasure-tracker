import { HelpRenderer } from './help-renderer';

describe('HelpRenderer', () => {
  it('renders help from static model catalogs without live provider discovery', () => {
    const renderer = new HelpRenderer();
    const catalogPort = {
      list: jest.fn().mockReturnValue([
        {
          provider: 'openai',
          models: ['gpt-5.4-mini'],
          defaultModel: 'gpt-5.4-mini',
          available: true,
        },
      ]),
    };

    const output = renderer.render(catalogPort);

    expect(catalogPort.list).toHaveBeenCalledTimes(1);
    expect(output).toContain('predict');
    expect(output).toContain('eval');
    expect(output).toContain('openai: gpt-5.4-mini');
    expect(output).toContain('Defaults: input=data/eval csv=data/eval/a.csv provider=openai');
  });
});