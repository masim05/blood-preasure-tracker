import { PassThrough } from 'node:stream';

import { JsonlOutputWriter } from '../../../src/adapters/inbound/cli/jsonl-output.writer';

describe('JsonlOutputWriter', () => {
  it('writes JSONL records to the provided stream', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const writer = new JsonlOutputWriter(output);
    await writer.write({ type: 'prediction', imageId: 'img001' });

    expect(stdout).toBe('{"type":"prediction","imageId":"img001"}\n');
  });

  it('defaults to process stdout when no stream is provided', async () => {
    const writeSpy = jest.spyOn(process.stdout, 'write').mockReturnValue(true);

    try {
      const writer = new JsonlOutputWriter();
      await writer.write({ type: 'summary' });

      expect(writeSpy).toHaveBeenCalledWith('{"type":"summary"}\n');
    } finally {
      writeSpy.mockRestore();
    }
  });
});