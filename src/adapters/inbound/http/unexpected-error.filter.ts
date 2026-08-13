import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { createHash } from 'node:crypto';

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
    type: 'error' | 'non_error';
    name: string;
    message: string;
    stack?: {
      frameCount: number;
      fingerprint: string;
    };
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
    path: requestPath(request.originalUrl || request.url),
    statusCode: 500,
    exception: normalizeException(thrown),
  };
}

function normalizeException(
  thrown: unknown,
): UnexpectedErrorLogEntry['exception'] {
  if (!(thrown instanceof Error)) {
    return {
      type: 'non_error',
      name: 'NonErrorThrown',
      message: 'Unexpected non-Error value thrown',
    };
  }

  const name = safeErrorName(thrown);
  const stack = safeStackSummary(thrown);
  return {
    type: 'error',
    name,
    message: `Unexpected ${name}`,
    ...(stack ? { stack } : {}),
  };
}

function requestPath(url: string): string {
  return url.split(/[?#]/, 1)[0];
}

function safeErrorName(error: Error): string {
  if (error instanceof EvalError) return 'EvalError';
  if (error instanceof RangeError) return 'RangeError';
  if (error instanceof ReferenceError) return 'ReferenceError';
  if (error instanceof SyntaxError) return 'SyntaxError';
  if (error instanceof TypeError) return 'TypeError';
  if (error instanceof URIError) return 'URIError';
  return 'Error';
}

function safeStackSummary(
  error: Error,
): UnexpectedErrorLogEntry['exception']['stack'] | undefined {
  try {
    if (typeof error.stack !== 'string' || error.stack.length === 0) {
      return undefined;
    }

    const stack = error.stack.slice(0, 65_536);
    return {
      frameCount: stack.split('\n').filter((line) => /^\s*at\s/.test(line))
        .length,
      fingerprint: createHash('sha256').update(stack).digest('hex'),
    };
  } catch {
    return undefined;
  }
}
