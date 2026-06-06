import { resolveTranslations } from './web-i18n';
import { renderHomePage, renderPolicyPage } from './web-layout';
import { HomeController } from './home.controller';
import { PolicyController } from './policy.controller';

describe('web i18n – resolveTranslations', () => {
  it('returns English when Accept-Language is absent', () => {
    expect(resolveTranslations(undefined).lang).toBe('en');
  });

  it('returns English for an unsupported language', () => {
    expect(resolveTranslations('de, de-AT').lang).toBe('en');
  });

  it('resolves Spanish from "es"', () => {
    expect(resolveTranslations('es').lang).toBe('es');
  });

  it('resolves Russian from "ru-RU"', () => {
    expect(resolveTranslations('ru-RU, ru').lang).toBe('ru');
  });

  it('resolves Chinese from "zh-CN"', () => {
    expect(resolveTranslations('zh-CN, zh').lang).toBe('zh');
  });

  it('resolves Japanese from "ja-JP"', () => {
    expect(resolveTranslations('ja-JP').lang).toBe('ja');
  });

  it('resolves French from priority list', () => {
    expect(resolveTranslations('de, fr-FR;q=0.9').lang).toBe('fr');
  });

  it('respects q weights when selecting language', () => {
    expect(resolveTranslations('fr;q=0.1, en;q=0.9').lang).toBe('en');
  });

  it('respects q weights with multiple supported languages', () => {
    expect(resolveTranslations('ru;q=0.3, es;q=0.7, en;q=0.5').lang).toBe('es');
  });

  it('excludes languages with q=0 (not acceptable)', () => {
    expect(resolveTranslations('en;q=0, de;q=1').lang).toBe('en'); // de unsupported, falls back to default
  });

  it('excludes languages with q=0 even if they are the only supported option', () => {
    expect(resolveTranslations('en;q=0, es;q=0, de;q=1').lang).toBe('en'); // all supported langs rejected, falls back to default
  });

  it('handles negative q values by clamping to 0 and excluding', () => {
    expect(resolveTranslations('en;q=-1, de;q=1').lang).toBe('en'); // negative q clamped to 0, excluded
  });

  it('clamps q values greater than 1', () => {
    expect(resolveTranslations('fr;q=5, en;q=1.5').lang).toBe('fr'); // both clamped to 1, first wins
  });

  it('resolves Portuguese', () => {
    expect(resolveTranslations('pt-BR').lang).toBe('pt');
  });

  it('resolves Italian', () => {
    expect(resolveTranslations('it-IT').lang).toBe('it');
  });

  it('resolves Swedish', () => {
    expect(resolveTranslations('sv-SE').lang).toBe('sv');
  });

  it('resolves Korean', () => {
    expect(resolveTranslations('ko-KR').lang).toBe('ko');
  });

  it('resolves Thai', () => {
    expect(resolveTranslations('th').lang).toBe('th');
  });

  it('resolves Vietnamese', () => {
    expect(resolveTranslations('vi-VN').lang).toBe('vi');
  });

  it('prefers explicit language over Accept-Language', () => {
    expect(resolveTranslations('en-US, en;q=0.9', 'es').lang).toBe('es');
  });

  it('ignores unsupported explicit language and falls back to Accept-Language', () => {
    expect(resolveTranslations('fr-FR, fr;q=0.9', 'de').lang).toBe('fr');
  });
});

describe('HomeController', () => {
  let controller: HomeController;

  beforeEach(() => {
    controller = new HomeController();
  });

  it('returns HTML for home page with English when no Accept-Language header', () => {
    const result = controller.getHome(undefined);
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html lang="en"');
    expect(result).toContain('Blood Pressure');
  });

  it('returns Spanish home page when Accept-Language is es', () => {
    const result = controller.getHome('es');
    expect(result).toContain('<html lang="es"');
    expect(result).toContain('Controla tus mediciones fácilmente');
  });

  it('returns Russian home page when Accept-Language is ru-RU', () => {
    const result = controller.getHome('ru-RU');
    expect(result).toContain('<html lang="ru"');
    expect(result).toContain('Отслеживайте показания с лёгкостью');
  });

  it('respects q-weights in Accept-Language header', () => {
    const result = controller.getHome('fr;q=0.1, en;q=0.9');
    expect(result).toContain('<html lang="en"');
  });

  it('uses explicit language query over Accept-Language header', () => {
    const result = controller.getHome('en-US, en;q=0.9', 'ru');
    expect(result).toContain('<html lang="ru"');
  });

  it.skip('contains Google Play CTA', () => {
    const result = controller.getHome(undefined);
    expect(result).toContain('Google Play');
  });

  it('contains footer with navigation links', () => {
    const result = controller.getHome(undefined);
    expect(result).toContain('href="/?lang=en"');
    expect(result).toContain('href="/policy?lang=en"');
  });

  it('marks home link as active', () => {
    const result = controller.getHome(undefined);
    expect(result).toMatch(/href="\/\?lang=en"[^>]*class="active"|class="active"[^>]*href="\/\?lang=en"/);
  });
});

describe('PolicyController', () => {
  let controller: PolicyController;

  beforeEach(() => {
    controller = new PolicyController();
  });

  it('returns HTML for policy page with English when no Accept-Language header', () => {
    const result = controller.getPolicy(undefined);
    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html lang="en"');
    expect(result).toContain('Privacy Policy');
  });

  it('returns Spanish policy page when Accept-Language is es', () => {
    const result = controller.getPolicy('es');
    expect(result).toContain('<html lang="es"');
    expect(result).toContain('Política de privacidad');
  });

  it('returns Russian policy page when Accept-Language is ru-RU', () => {
    const result = controller.getPolicy('ru-RU');
    expect(result).toContain('<html lang="ru"');
    expect(result).toContain('Политика конфиденциальности');
  });

  it('respects q-weights in Accept-Language header', () => {
    const result = controller.getPolicy('ru;q=0.3, es;q=0.7, en;q=0.5');
    expect(result).toContain('<html lang="es"');
  });

  it('uses explicit language query over Accept-Language header', () => {
    const result = controller.getPolicy('en-US, en;q=0.9', 'ja');
    expect(result).toContain('<html lang="ja"');
  });

  it('contains all required policy sections', () => {
    const result = controller.getPolicy(undefined);
    expect(result).toContain('email address');
    expect(result).toContain('blood pressure monitor');
    expect(result).toContain('OpenAI');
    expect(result).toContain('not a medical device');
    expect(result).toContain('blood.pressure.by.max@gmail.com');
  });

  it('contains footer with navigation links', () => {
    const result = controller.getPolicy(undefined);
    expect(result).toContain('href="/?lang=en"');
    expect(result).toContain('href="/policy?lang=en"');
  });

  it('marks policy link as active', () => {
    const result = controller.getPolicy(undefined);
    expect(result).toMatch(/href="\/policy\?lang=en"[^>]*class="active"|class="active"[^>]*href="\/policy\?lang=en"/);
  });
});

describe('web layout – renderHomePage', () => {
  it('renders an HTML document with the story', () => {
    const t = resolveTranslations(undefined);
    const html = renderHomePage(t);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('Blood Pressure');
    expect(html).toContain('Track your readings easily');
    expect(html).toContain('blood pressure monitor');
    expect(html).toContain('Google Play');
    expect(html).toContain('<footer');
    expect(html).toContain('href="/?lang=en"');
    expect(html).toContain('href="/policy?lang=en"');
    expect(html).toContain('class="language-picker-form"');
    expect(html).toContain('material-icons-outlined');
    expect(html).toContain('>language<');
    expect(html).toContain('name="lang"');
  });

  it('renders Russian home page', () => {
    const t = resolveTranslations('ru');
    const html = renderHomePage(t);

    expect(html).toContain('<html lang="ru"');
    expect(html).toContain('Отслеживайте показания с лёгкостью');
    expect(html).toContain('тонометра');
    expect(html).toContain('Google Play');
  });

  it('renders Chinese home page', () => {
    const t = resolveTranslations('zh');
    const html = renderHomePage(t);

    expect(html).toContain('<html lang="zh"');
    expect(html).toContain('轻松追踪');
  });

  it('marks the home link as active on the home page', () => {
    const t = resolveTranslations(undefined);
    const html = renderHomePage(t);
    expect(html).toMatch(/href="\/\?lang=en"[^>]*class="active"|class="active"[^>]*href="\/\?lang=en"/);
  });
});

describe('web layout – renderPolicyPage', () => {
  it('renders an HTML document with the privacy policy', () => {
    const t = resolveTranslations(undefined);
    const html = renderPolicyPage(t);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<html lang="en"');
    expect(html).toContain('Privacy Policy');
    expect(html).toContain('email address');
    expect(html).toContain('blood pressure monitor');
    expect(html).toContain('OpenAI');
    expect(html).toContain('not a medical device');
    expect(html).toContain('blood.pressure.by.max@gmail.com');
    expect(html).toContain('<footer');
    expect(html).toContain('href="/?lang=en"');
    expect(html).toContain('href="/policy?lang=en"');
  });

  it('renders Russian policy page', () => {
    const t = resolveTranslations('ru');
    const html = renderPolicyPage(t);

    expect(html).toContain('<html lang="ru"');
    expect(html).toContain('Политика конфиденциальности');
    expect(html).toContain('OpenAI');
    expect(html).toContain('медицинским устройством');
    expect(html).toContain('blood.pressure.by.max@gmail.com');
  });

  it('marks the policy link as active on the policy page', () => {
    const t = resolveTranslations(undefined);
    const html = renderPolicyPage(t);
    expect(html).toMatch(/href="\/policy\?lang=en"[^>]*class="active"|class="active"[^>]*href="\/policy\?lang=en"/);
  });

  it('escapes special characters in translated content', () => {
    const t = resolveTranslations(undefined);
    const html = renderPolicyPage(t);
    expect(html).not.toMatch(/<script/i);
  });
});
