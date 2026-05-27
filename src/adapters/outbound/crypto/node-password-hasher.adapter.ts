import { Injectable } from '@nestjs/common';
import { pbkdf2, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import type { PasswordHasherPort } from '../../../application/ports/password-hasher.port';

const pbkdf2Async = promisify(pbkdf2);
const ITERATIONS = 600_000;
const MAX_VERIFY_ITERATIONS = 1_000_000;
const KEY_LENGTH = 32;
const DIGEST = 'sha256';

@Injectable()
export class NodePasswordHasherAdapter implements PasswordHasherPort {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('base64url');
    const derived = await pbkdf2Async(password, salt, ITERATIONS, KEY_LENGTH, DIGEST);

    return `pbkdf2:${DIGEST}:${ITERATIONS}:${salt}:${derived.toString('base64url')}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const parts = hash.split(':');
    if (parts.length !== 5 || parts[0] !== 'pbkdf2') {
      return false;
    }

    const [, digest, iterationsText, salt, expectedText] = parts;
    const iterations = Number(iterationsText);
    if (digest !== DIGEST || !Number.isInteger(iterations) || iterations <= 0 || iterations > MAX_VERIFY_ITERATIONS) {
      return false;
    }

    const expected = Buffer.from(expectedText, 'base64url');
    const actual = await pbkdf2Async(password, salt, iterations, expected.length, digest);

    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
