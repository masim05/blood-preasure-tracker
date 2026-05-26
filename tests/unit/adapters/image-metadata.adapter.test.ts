import { readFileSync } from 'node:fs';
import path from 'node:path';

import { ImageMetadataAdapter } from '../../../src/adapters/outbound/filesystem/image-metadata.adapter';

const fixturePath = path.join(
  process.cwd(),
  'tests/fixtures/images/2026-05-19 06-05-20.JPG',
);

describe('ImageMetadataAdapter', () => {
  it('extracts and normalizes the timestamp from the reported Samsung JPEG fixture', async () => {
    const adapter = new ImageMetadataAdapter();

    const result = await adapter.extractTimestamp({
      imageId: '2026-05-19 06-05-20',
      imagePath: fixturePath,
      data: readFileSync(fixturePath),
    });

    expect(result.time).toBe('2026-05-19 06:05:20');
    expect(result.sourceTag).toBe('DateTimeOriginal');
    expect(result.issues).toEqual([]);
  });

  it('reports null time for unreadable metadata', async () => {
    const adapter = new ImageMetadataAdapter();

    const result = await adapter.extractTimestamp({
      imageId: 'missing-time',
      imagePath: 'missing-time.jpg',
      data: Buffer.from('not-a-jpeg'),
    });

    expect(result).toEqual({
      imageId: 'missing-time',
      imagePath: 'missing-time.jpg',
      time: null,
      sourceTag: null,
      rawValue: null,
      issues: [expect.stringContaining('Unable to read embedded timestamp metadata')],
    });
  });
});
