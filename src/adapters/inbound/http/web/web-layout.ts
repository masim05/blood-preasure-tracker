import { SUPPORTED_LANGS, type SupportedLang, type WebTranslations } from './web-i18n';
import { renderPolicyContentHtml } from './policy-content';

const COLORS = {
  primary: '#1D9E75',
  secondary: '#185FA5',
  background: '#F2F2F7',
  surface: '#FFFFFF',
  onBackground: '#111111',
  muted: '#6B6B6B',
  border: '#E5E5E5',
  error: '#E24B4A',
} as const;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function heartSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${COLORS.primary}" width="24" height="24" aria-hidden="true"><path d="M12 21.593c-.525-.445-4.52-3.888-6.55-5.86C3.15 13.46 2 11.56 2 9.5 2 6.42 4.42 4 7.5 4c1.74 0 3.41.81 4.5 2.09C13.09 4.81 14.76 4 16.5 4 19.58 4 22 6.42 22 9.5c0 2.06-1.15 3.96-3.45 6.233-2.03 1.972-6.025 5.415-6.55 5.86z"/></svg>`;
}

const LANGUAGE_LABELS: Record<SupportedLang, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português',
  it: 'Italiano',
  sv: 'Svenska',
  ru: 'Русский',
  zh: '中文',
  ko: '한국어',
  ja: '日本語',
  th: 'ไทย',
  vi: 'Tiếng Việt',
};

function languageOptions(selectedLang: SupportedLang): string {
  return SUPPORTED_LANGS.map((lang) => {
    const selected = lang === selectedLang ? ' selected' : '';
    return `<option value="${lang}"${selected}>${escapeHtml(LANGUAGE_LABELS[lang])}</option>`;
  }).join('');
}

function withLang(path: '/' | '/policy', lang: string): string {
  return `${path}?lang=${encodeURIComponent(lang)}`;
}

export function renderLayout(
  t: WebTranslations,
  title: string,
  bodyHtml: string,
  currentPath: '/' | '/policy',
): string {
  const homeActive = currentPath === '/';
  const policyActive = currentPath === '/policy';

  return `<!DOCTYPE html>
<html lang="${escapeHtml(t.lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Outlined" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { font-size: 16px; }
    body {
      font-family: 'Roboto', sans-serif;
      background: ${COLORS.background};
      color: ${COLORS.onBackground};
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    a { color: ${COLORS.primary}; text-decoration: none; }
    a:hover { text-decoration: underline; }

    /* Header */
    .site-header {
      background: ${COLORS.surface};
      border-bottom: 1px solid ${COLORS.border};
      padding: 0 1.5rem;
      height: 56px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .site-header .logo-icon { display: flex; align-items: center; color: ${COLORS.primary}; }
    .site-header .app-name {
      font-size: 1.125rem;
      font-weight: 700;
      color: ${COLORS.onBackground};
      letter-spacing: -0.01em;
    }
    .site-header .header-spacer { flex: 1; }
    .language-picker-form {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }
    .language-picker-form .material-icons-outlined {
      color: ${COLORS.primary};
      font-size: 1.25rem;
      line-height: 1;
    }
    .language-picker-select {
      appearance: none;
      border: 1px solid ${COLORS.border};
      border-radius: 8px;
      background: ${COLORS.surface};
      color: ${COLORS.onBackground};
      font-size: 0.875rem;
      padding: 0.375rem 1.75rem 0.375rem 0.625rem;
      font-family: 'Roboto', sans-serif;
    }
    .language-picker-select:focus-visible {
      outline: 2px solid ${COLORS.secondary};
      outline-offset: 1px;
    }

    /* Main content */
    main {
      flex: 1;
      max-width: 720px;
      width: 100%;
      margin: 0 auto;
      padding: 2rem 1.5rem;
    }

    /* Card */
    .card {
      background: ${COLORS.surface};
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 1.5rem;
    }

    /* Home page */
    .home-tagline {
      font-size: 1.5rem;
      font-weight: 700;
      color: ${COLORS.onBackground};
      margin-bottom: 1.5rem;
      line-height: 1.3;
    }
    .story p {
      font-size: 1rem;
      line-height: 1.75;
      color: ${COLORS.onBackground};
      margin-bottom: 1rem;
    }
    .story p:last-child { margin-bottom: 0; }
    .google-play-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: ${COLORS.primary};
      color: #fff;
      font-family: 'Roboto', sans-serif;
      font-size: 0.9375rem;
      font-weight: 500;
      padding: 0.75rem 1.25rem;
      border-radius: 8px;
      text-decoration: none;
      margin-top: 1.5rem;
      transition: opacity 0.15s;
    }
    .google-play-btn:hover { opacity: 0.88; text-decoration: none; }

    /* Policy page */
    .policy-intro {
      font-size: 1rem;
      line-height: 1.75;
      color: ${COLORS.muted};
      margin-bottom: 1.5rem;
    }
    .policy-section { margin-bottom: 1.5rem; }
    .policy-section:last-child { margin-bottom: 0; }
    .policy-section h2 {
      font-size: 0.875rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: ${COLORS.muted};
      margin-bottom: 0.5rem;
    }
    .policy-section p {
      font-size: 1rem;
      line-height: 1.75;
      color: ${COLORS.onBackground};
    }
    .policy-page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: ${COLORS.onBackground};
      margin-bottom: 1rem;
    }

    /* Footer */
    .site-footer {
      background: ${COLORS.surface};
      border-top: 1px solid ${COLORS.border};
      padding: 1rem 1.5rem;
      text-align: center;
    }
    .site-footer nav {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
    }
    .site-footer a {
      font-size: 0.875rem;
      color: ${COLORS.muted};
    }
    .site-footer a.active,
    .site-footer a:hover { color: ${COLORS.primary}; }
    .site-footer a.active { font-weight: 500; }

    @media (max-width: 600px) {
      main { padding: 1.25rem 1rem; }
      .card { padding: 1.25rem; }
      .home-tagline { font-size: 1.25rem; }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <span class="logo-icon">${heartSvg()}</span>
    <span class="app-name">${escapeHtml(t.appName)}</span>
    <span class="header-spacer"></span>
    <form class="language-picker-form" method="get" action="${currentPath}">
      <span class="material-icons-outlined" aria-hidden="true">language</span>
      <select id="lang-picker" name="lang" class="language-picker-select" aria-label="Language" onchange="this.form.submit()">
        ${languageOptions(t.lang as SupportedLang)}
      </select>
      <noscript><button type="submit">OK</button></noscript>
    </form>
  </header>

  <main>
    ${bodyHtml}
  </main>

  <footer class="site-footer">
    <nav>
      <a href="${withLang('/', t.lang)}" class="${homeActive ? 'active' : ''}">${escapeHtml(t.footer.home)}</a>
      <a href="${withLang('/policy', t.lang)}" class="${policyActive ? 'active' : ''}">${escapeHtml(t.footer.policy)}</a>
    </nav>
  </footer>
</body>
</html>`;
}

export function renderHomePage(t: WebTranslations): string {
  const storyParagraphs = t.home.story.map((p) => `    <p>${escapeHtml(p)}</p>`).join('\n');

  const body = `
<div class="card">
  <h1 class="home-tagline">${escapeHtml(t.tagline)}</h1>
  <div class="story">
${storyParagraphs}
  </div>
</div>`;

  return renderLayout(t, t.home.metaTitle, body, '/');
}

export function renderPolicyPage(
  t: WebTranslations,
  policyContentHtml: string = renderPolicyContentHtml(t),
): string {
  return renderLayout(t, t.policy.metaTitle, policyContentHtml, '/policy');
}
