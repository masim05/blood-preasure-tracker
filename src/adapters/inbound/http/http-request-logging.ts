import { Injectable, Logger } from '@nestjs/common';

export type HttpRequestLogEntry = {
  level: 'debug' | 'error';
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
};

type RequestLogger = {
  debug(message: string): void;
  error(message: string): void;
};

export type HttpLoggingRequest = {
  method: string;
  originalUrl?: string;
  url: string;
};

export type HttpLoggingResponse = {
  statusCode: number;
  once(event: 'finish', listener: () => void): void;
};

@Injectable()
export class HttpRequestLoggingMiddleware {
  private logger: RequestLogger = new Logger('HttpRequest');

  static withLogger(logger: RequestLogger): HttpRequestLoggingMiddleware {
    const middleware = new HttpRequestLoggingMiddleware();
    middleware.logger = logger;

    return middleware;
  }

  use(request: HttpLoggingRequest, response: HttpLoggingResponse, next: () => void): void {
    const startedAt = process.hrtime.bigint();

    response.once('finish', () => {
      const entry = createHttpRequestLogEntry(request, response.statusCode, elapsedMilliseconds(startedAt));
      const serialized = JSON.stringify(entry);

      if (entry.level === 'error') {
        this.logger.error(serialized);
        return;
      }

      this.logger.debug(serialized);
    });

    next();
  }
}

export function createHttpRequestLogEntry(request: HttpLoggingRequest, statusCode: number, durationMs: number): HttpRequestLogEntry {
  return {
    level: statusCode >= 500 ? 'error' : 'debug',
    method: request.method,
    path: request.originalUrl || request.url,
    statusCode,
    durationMs,
  };
}

function elapsedMilliseconds(startedAt: bigint): number {
  return Number((process.hrtime.bigint() - startedAt) / 1_000_000n);
}
