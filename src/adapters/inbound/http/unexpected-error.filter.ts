import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';

import { UnexpectedHttpException } from './http-error.mapper';

type ErrorLogger = {
  error(message: string): void;
};

type UnexpectedErrorLogEntry = {
  level: 'error';
  method: string;
  path: string;
  statusCode: 500;
  exception: {
    name: string;
    message: string;
    stack?: string;
  };
};

type UnexpectedErrorRequest = {
  method: string;
  originalUrl?: string;
  url: string;
};

type UnexpectedErrorResponse = {
  status(statusCode: number): UnexpectedErrorResponse;
  json(body: unknown): void;
};

@Catch(UnexpectedHttpException)
export class UnexpectedErrorFilter implements ExceptionFilter<UnexpectedHttpException> {
  private logger: ErrorLogger = new Logger('UnexpectedHttpError');

  static withLogger(logger: ErrorLogger): UnexpectedErrorFilter {
    const filter = new UnexpectedErrorFilter();
    filter.logger = logger;
    return filter;
  }

  catch(exception: UnexpectedHttpException, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<UnexpectedErrorRequest>();
    const response = http.getResponse<UnexpectedErrorResponse>();

    this.logger.error(
      JSON.stringify(
        createUnexpectedErrorLogEntry(request, exception.unexpectedCause),
      ),
    );
    response.status(500).json(exception.getResponse());
  }
}

export function createUnexpectedErrorLogEntry(
  request: UnexpectedErrorRequest,
  thrown: unknown,
): UnexpectedErrorLogEntry {
  return {
    level: 'error',
    method: request.method,
    path: request.originalUrl || request.url,
    statusCode: 500,
    exception: normalizeException(thrown),
  };
}

function normalizeException(
  thrown: unknown,
): UnexpectedErrorLogEntry['exception'] {
  if (!(thrown instanceof Error)) {
    return {
      name: 'NonErrorThrown',
      message: 'Unexpected non-Error value thrown',
    };
  }

  return {
    name: sanitizeDiagnosticText(thrown.name || 'Error'),
    message: sanitizeDiagnosticText(thrown.message),
    ...(thrown.stack ? { stack: sanitizeDiagnosticText(thrown.stack) } : {}),
  };
}

function sanitizeDiagnosticText(value: string): string {
  return value
    .slice(0, 16_384)
    .replace(/\b(bearer)\s+[^\s,;]+/gi, '$1 [REDACTED]')
    .replace(
      /\b(postgres(?:ql)?|https?):\/\/[^\s/@:]+:[^\s/@]+@/gi,
      '$1://[REDACTED]@',
    )
    .replace(
      /\b(authorization|cookie|password|passwd|secret|token|api[_ -]?key|email|systolic|diastolic|pulse)\b\s*[:=]\s*([^\s,;}]+)/gi,
      '$1=[REDACTED]',
    );
}
