import { resolveTranslations } from './web-i18n';
import { renderHomePage, renderPolicyPage } from './web-layout';

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
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/policy"');
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
    expect(html).toMatch(/href="\/"[^>]*class="active"|class="active"[^>]*href="\/"/);
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
    expect(html).toContain('support@bloodpressure.app');
    expect(html).toContain('<footer');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/policy"');
  });

  it('renders Russian policy page', () => {
    const t = resolveTranslations('ru');
    const html = renderPolicyPage(t);

    expect(html).toContain('<html lang="ru"');
    expect(html).toContain('Политика конфиденциальности');
    expect(html).toContain('OpenAI');
    expect(html).toContain('медицинским устройством');
    expect(html).toContain('support@bloodpressure.app');
  });

  it('marks the policy link as active on the policy page', () => {
    const t = resolveTranslations(undefined);
    const html = renderPolicyPage(t);
    expect(html).toMatch(/href="\/policy"[^>]*class="active"|class="active"[^>]*href="\/policy"/);
  });

  it('escapes special characters in translated content', () => {
    const t = resolveTranslations(undefined);
    const html = renderPolicyPage(t);
    expect(html).not.toMatch(/<script/i);
  });
});
