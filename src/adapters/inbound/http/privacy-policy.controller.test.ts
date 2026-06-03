import { PrivacyPolicyController } from './privacy-policy.controller';

describe('privacy policy controller', () => {
  it('returns the required privacy policy disclosures at root path', () => {
    const html = new PrivacyPolicyController().privacyPolicy();

    expect(html).toContain('This app is not a medical device and does not diagnose, treat, cure, or prevent any medical condition.');
    expect(html).toContain('email/login');
    expect(html).toContain('blood pressure monitor photos');
    expect(html).toContain('Blood pressure values');
    expect(html).toContain('Measurement date and time');
    expect(html).toContain('history');
    expect(html).toContain('https://bpt.crptmax.com/');
    expect(html).toContain('delete your account and related data');
    expect(html).toContain('support@bpt.crptmax.com');
  });
});
