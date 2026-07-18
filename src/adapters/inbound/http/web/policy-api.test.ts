import { PolicyController } from './policy.controller';

describe('PolicyController API policy endpoint', () => {
  let controller: PolicyController;

  beforeEach(() => {
    controller = new PolicyController();
  });

  it('returns English policy HTML when language is not specified', () => {
    const html = controller.getPolicyApi(undefined, undefined);
    expect(html).toContain('Privacy Policy');
    expect(html).toContain('Last updated: July 18, 2026');
  });

  it('uses lang query parameter over Accept-Language', () => {
    const html = controller.getPolicyApi('en-US,en;q=0.9', 'ru');
    expect(html).toContain('Политика конфиденциальности');
    expect(html).toContain('Последнее обновление: 18 июля 2026 г.');
  });

  it('falls back to Accept-Language when lang query is absent', () => {
    const html = controller.getPolicyApi('es-ES,es;q=0.9', undefined);
    expect(html).toContain('Política de privacidad');
    expect(html).toContain('Última actualización: 18 de julio de 2026');
  });

  it('includes developer name in policy content', () => {
    const html = controller.getPolicyApi(undefined, undefined);
    expect(html).toContain('Maxim Ryndin');
  });

  it('uses the same policy HTML source for web page and API endpoint', () => {
    const apiHtml = controller.getPolicyApi('fr-FR,fr;q=0.9', undefined);
    const pageHtml = controller.getPolicy('fr-FR,fr;q=0.9', undefined);
    const apiBody = apiHtml.match(/<body>\s*([\s\S]*?)\s*<\/body>/)?.[1];
    expect(apiBody).toBeDefined();
    expect(pageHtml).toContain(apiBody as string);
  });
});
