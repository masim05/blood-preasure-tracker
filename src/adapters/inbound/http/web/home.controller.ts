/* istanbul ignore file */
import { Controller, Get, Header, Headers, Query } from '@nestjs/common';

import { resolveTranslations } from './web-i18n';
import { renderHomePage } from './web-layout';

@Controller('/')
export class HomeController {
  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  getHome(
    @Headers('accept-language') acceptLanguage: string | undefined,
    @Query('lang') requestedLanguage: string | undefined,
  ): string {
    const t = resolveTranslations(acceptLanguage, requestedLanguage);
    return renderHomePage(t);
  }
}
