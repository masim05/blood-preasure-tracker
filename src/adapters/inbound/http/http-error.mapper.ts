import {
  BadRequestException,
  ConflictException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

export type ApiErrorCode =
  | 'validation_error'
  | 'unauthorized'
  | 'not_found'
  | 'conflict';

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export class UnexpectedHttpException extends InternalServerErrorException {
  constructor(readonly unexpectedCause: unknown) {
    super({ error: 'internal_server_error', message: 'Internal server error' });
  }
}

export function toHttpException(error: unknown): Error {
  if (error instanceof HttpException) {
    return error;
  }

  if (!(error instanceof ApiError)) {
    return new UnexpectedHttpException(error);
  }

  const body = { error: error.code, message: error.message };
  switch (error.code) {
    case 'unauthorized':
      return new UnauthorizedException(body);
    case 'not_found':
      return new NotFoundException(body);
    case 'conflict':
      return new ConflictException(body);
    case 'validation_error':
      return new BadRequestException(body);
  }
}
