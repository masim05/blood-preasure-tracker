import { type WebTranslations } from './web-i18n';
import { escapeHtml } from './html-escape';

const SUPPORT_EMAIL = 'blood.pressure.by.max@gmail.com';
const DEVELOPER_NAME = 'Maxim Ryndin';

function linkifySupportEmail(text: string): string {
  const escapedEmail = escapeHtml(SUPPORT_EMAIL);
  const mailto = `mailto:${SUPPORT_EMAIL}`;
  return text.replaceAll(
    escapedEmail,
    `<a href="${mailto}">${escapedEmail}</a>`,
  );
}

export function renderPolicyContentHtml(t: WebTranslations): string {
  const sections = t.policy.sections
    .map(
      (section) => `
  <div class="policy-section">
    <h2>${escapeHtml(section.heading)}</h2>
    <p>${linkifySupportEmail(escapeHtml(section.content))}</p>
  </div>`,
    )
    .join('');

  return `
<div class="card">
  <h1 class="policy-page-title">${escapeHtml(t.footer.policy)}</h1>
  <p class="policy-intro">${escapeHtml(t.policy.intro)}</p>
  <p class="policy-intro">${escapeHtml(t.policy.lastUpdated)}</p>
  <p class="policy-intro">${escapeHtml(DEVELOPER_NAME)}</p>
${sections}
</div>`;
}

export function renderPolicyStandaloneHtml(t: WebTranslations): string {
  const contentHtml = renderPolicyContentHtml(t);
  return `<!DOCTYPE html>
<html lang="${escapeHtml(t.lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(t.policy.metaTitle)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, sans-serif;
      background: #F2F2F7;
      color: #111111;
      padding: 1rem;
    }
    .card {
      background: #FFFFFF;
      border-radius: 12px;
      padding: 1.25rem;
      margin: 0 auto;
      max-width: 720px;
    }
    .policy-page-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }
    .policy-intro {
      font-size: 1rem;
      line-height: 1.7;
      color: #6B6B6B;
      margin-bottom: 1rem;
    }
    .policy-section { margin-bottom: 1.25rem; }
    .policy-section:last-child { margin-bottom: 0; }
    .policy-section h2 {
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #6B6B6B;
      margin-bottom: 0.4rem;
    }
    .policy-section p {
      font-size: 1rem;
      line-height: 1.7;
      color: #111111;
    }
    a { color: #1D9E75; }
  </style>
</head>
<body>
${contentHtml}
</body>
</html>`;
}
