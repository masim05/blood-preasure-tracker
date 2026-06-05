/* istanbul ignore file */
import { Controller, Get, Header, Headers } from '@nestjs/common';

import { resolveTranslations } from './web-i18n';
import { renderPolicyPage } from './web-layout';

@Controller('/policy')
export class PolicyController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getPolicy(@Headers('accept-language') acceptLanguage: string | undefined): string {
    const t = resolveTranslations(acceptLanguage);
    return renderPolicyPage(t);
  }
}
