import { EventEmitter } from 'node:events';
import { PassThrough, type Writable } from 'node:stream';

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

  it('serializes null metadata time and time uncertainty without rewriting values', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const writer = new JsonlOutputWriter(output);
    await writer.write({
      type: 'prediction',
      imageId: 'missing-time',
      time: null,
      uncertainFields: ['time'],
    });

    expect(stdout).toBe(
      '{"type":"prediction","imageId":"missing-time","time":null,"uncertainFields":["time"]}\n',
    );
  });

  it('writes raw text without JSON encoding', async () => {
    const output = new PassThrough();
    let stdout = '';
    output.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });

    const writer = new JsonlOutputWriter(output);
    await writer.writeText('hand: 1/1 (100.0%)\n');

    expect(stdout).toBe('hand: 1/1 (100.0%)\n');
  });

  it('waits for drain when stream backpressure is signaled', async () => {
    const output = new EventEmitter() as Writable;
    output.write = jest.fn().mockReturnValue(false);
    const writer = new JsonlOutputWriter(output);
    let completed = false;

    const writePromise = writer.write({ type: 'prediction' }).then(() => {
      completed = true;
    });

    await Promise.resolve();
    expect(completed).toBe(false);

    output.emit('drain');
    await writePromise;

    expect(completed).toBe(true);
    expect(output.listenerCount('drain')).toBe(0);
    expect(output.listenerCount('error')).toBe(0);
    expect(output.write).toHaveBeenCalledWith('{"type":"prediction"}\n');
  });

  it('waits for drain when raw text output is backpressured', async () => {
    const output = new EventEmitter() as Writable;
    output.write = jest.fn().mockReturnValue(false);
    const writer = new JsonlOutputWriter(output);
    let completed = false;

    const writePromise = writer.writeText('accuracy\n').then(() => {
      completed = true;
    });

    await Promise.resolve();
    expect(completed).toBe(false);

    output.emit('drain');
    await writePromise;

    expect(completed).toBe(true);
    expect(output.listenerCount('drain')).toBe(0);
    expect(output.listenerCount('error')).toBe(0);
    expect(output.write).toHaveBeenCalledWith('accuracy\n');
  });

  it('rejects when a backpressured stream emits an error', async () => {
    const output = new EventEmitter() as Writable;
    output.write = jest.fn().mockReturnValue(false);
    const writer = new JsonlOutputWriter(output);
    const writePromise = writer.write({ type: 'prediction' });

    output.emit('error', new Error('stream failed'));

    await expect(writePromise).rejects.toThrow('stream failed');
    expect(output.listenerCount('drain')).toBe(0);
    expect(output.listenerCount('error')).toBe(0);
  });

  it('rejects raw text output when a backpressured stream emits an error', async () => {
    const output = new EventEmitter() as Writable;
    output.write = jest.fn().mockReturnValue(false);
    const writer = new JsonlOutputWriter(output);
    const writePromise = writer.writeText('accuracy\n');

    output.emit('error', new Error('stream failed'));

    await expect(writePromise).rejects.toThrow('stream failed');
    expect(output.listenerCount('drain')).toBe(0);
    expect(output.listenerCount('error')).toBe(0);
  });
});