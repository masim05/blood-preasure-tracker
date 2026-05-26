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
    await new Promise<void>((resolve, reject) => {
      let settled = false;

      const settle = (error?: unknown): void => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();

        if (error) {
          reject(error instanceof Error ? error : new Error(String(error)));
          return;
        }

        resolve();
      };

      const cleanup = (): void => {
        this.output.off('error', onError);
      };
      const onError = (error: unknown): void => {
        settle(error);
      };

      this.output.once('error', onError);

      try {
        this.output.write(chunk, (error?: Error | null) => {
          settle(error ?? undefined);
        });
      } catch (error) {
        settle(error);
      }
    });
  }
}