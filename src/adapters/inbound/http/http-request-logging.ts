import { Injectable, Logger } from '@nestjs/common';

export type HttpRequestLogEntry = {
  level: 'debug';
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
};

type DebugLogger = {
  debug(message: string): void;
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
  private readonly logger: DebugLogger;

  constructor(logger: DebugLogger = new Logger('HttpRequest')) {
    this.logger = logger;
  }

  use(request: HttpLoggingRequest, response: HttpLoggingResponse, next: () => void): void {
    const startedAt = process.hrtime.bigint();

    response.once('finish', () => {
      this.logger.debug(JSON.stringify(createHttpRequestLogEntry(request, response.statusCode, elapsedMilliseconds(startedAt))));
    });

    next();
  }
}

export function createHttpRequestLogEntry(request: HttpLoggingRequest, statusCode: number, durationMs: number): HttpRequestLogEntry {
  return {
    level: 'debug',
    method: request.method,
    path: request.originalUrl || request.url,
    statusCode,
    durationMs,
  };
}

function elapsedMilliseconds(startedAt: bigint): number {
  return Number((process.hrtime.bigint() - startedAt) / 1_000_000n);
}
