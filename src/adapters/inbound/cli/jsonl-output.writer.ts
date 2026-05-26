import { Injectable } from '@nestjs/common';
import process from 'node:process';
import type { Writable } from 'node:stream';

import type { OutputWriterPort } from '../../../application/ports/output-writer.port';

@Injectable()
export class JsonlOutputWriter implements OutputWriterPort {
  constructor(private readonly output: Writable = process.stdout) {}

  async write(record: unknown): Promise<void> {
    await this.writeChunk(`${JSON.stringify(record)}\n`);
  }

  async writeText(text: string): Promise<void> {
    await this.writeChunk(text);
  }

  private async writeChunk(chunk: string): Promise<void> {
    const accepted = this.output.write(chunk);

    if (!accepted) {
      await waitForDrain(this.output);
    }
  }
}

function waitForDrain(output: Writable): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = (): void => {
      output.off('drain', onDrain);
      output.off('error', onError);
    };
    const onDrain = (): void => {
      cleanup();
      resolve();
    };
    const onError = (error: unknown): void => {
      cleanup();
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    output.once('drain', onDrain);
    output.once('error', onError);
  });
}