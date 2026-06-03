/* istanbul ignore file */
import { Controller, Get, Header } from '@nestjs/common';

@Controller('/')
export class PrivacyPolicyController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  privacyPolicy(): string {
    return `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Blood Pressure Tracker — Privacy Policy</title>
  </head>
  <body>
    <h1>Privacy Policy</h1>
    <p>Effective date: 2026-06-03</p>
    <p>
      This app is not a medical device and does not diagnose, treat, cure, or prevent any medical condition.
    </p>
    <h2>Data we collect</h2>
    <ul>
      <li>Account data: email/login credentials.</li>
      <li>Uploaded blood pressure monitor photos.</li>
      <li>Blood pressure values (systolic, diastolic, pulse).</li>
      <li>Measurement date and time.</li>
    </ul>
    <h2>Why we collect it</h2>
    <ul>
      <li>To create and authenticate your account.</li>
      <li>To recognize, upload, and display measurement details.</li>
      <li>To keep measurement history in the app.</li>
    </ul>
    <h2>Where data is stored</h2>
    <p>Data is stored on secured API infrastructure operated for Blood Pressure Tracker at https://bpt.crptmax.com/.</p>
    <h2>Account and data deletion</h2>
    <p>To delete your account and related data, send a request from your account email to support@bpt.crptmax.com.</p>
    <h2>Contact</h2>
    <p>support@bpt.crptmax.com</p>
  </body>
</html>
`.trim();
  }
}
