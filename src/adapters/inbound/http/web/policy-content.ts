import { type WebTranslations } from './web-i18n';

const SUPPORT_EMAIL = 'blood.pressure.by.max@gmail.com';
const DEVELOPER_NAME = 'Maxim Ryndin';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
