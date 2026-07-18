import { Controller, Get, Header, Headers, Query } from '@nestjs/common';

import { renderPolicyContentHtml, renderPolicyStandaloneHtml } from './policy-content';
import { resolveTranslations } from './web-i18n';
import { renderPolicyPage } from './web-layout';

@Controller()
export class PolicyController {
  @Get('/policy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getPolicy(
    @Headers('accept-language') acceptLanguage: string | undefined,
    @Query('lang') preferredLanguage: string | string[] | undefined,
  ): string {
    const t = resolveTranslations(acceptLanguage, preferredLanguage);
    return renderPolicyPage(t, renderPolicyContentHtml(t));
  }

  @Get('/api/v1/policy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getPolicyApi(
    @Headers('accept-language') acceptLanguage: string | undefined,
    @Query('lang') preferredLanguage: string | string[] | undefined,
  ): string {
    const t = resolveTranslations(acceptLanguage, preferredLanguage);
    return renderPolicyStandaloneHtml(t);
  }
}
