import { Injectable } from '@nestjs/common';
import { once } from 'node:events';
import process from 'node:process';
import type { Writable } from 'node:stream';

import type { OutputWriterPort } from '../../../application/ports/output-writer.port';

@Injectable()
export class JsonlOutputWriter implements OutputWriterPort {
  constructor(private readonly output: Writable = process.stdout) {}

  async write(record: unknown): Promise<void> {
    const accepted = this.output.write(`${JSON.stringify(record)}\n`);

    if (!accepted) {
      await Promise.race([
        once(this.output, 'drain'),
        once(this.output, 'error').then(([error]) => {
          throw error instanceof Error ? error : new Error(String(error));
        }),
      ]);
    }
  }
}