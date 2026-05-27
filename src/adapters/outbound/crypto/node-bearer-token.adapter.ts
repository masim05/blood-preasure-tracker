import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';

import type { BearerTokenGeneratorPort } from '../../../application/ports/bearer-token-store.port';

@Injectable()
export class NodeBearerTokenAdapter implements BearerTokenGeneratorPort {
  generate(): string {
    return randomBytes(32).toString('base64url');
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('base64url');
  }
}
