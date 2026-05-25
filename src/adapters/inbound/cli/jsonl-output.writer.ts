import { Injectable } from '@nestjs/common';
import process from 'node:process';
import type { Writable } from 'node:stream';

import type { OutputWriterPort } from '../../../application/ports/output-writer.port';

@Injectable()
export class JsonlOutputWriter implements OutputWriterPort {
  constructor(private readonly output: Writable = process.stdout) {}

  async write(record: unknown): Promise<void> {
    this.output.write(`${JSON.stringify(record)}\n`);
  }
}