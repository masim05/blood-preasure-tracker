import { readFileSync } from 'node:fs';
import path from 'node:path';

import { ImageMetadataAdapter } from '../../src/adapters/outbound/filesystem/image-metadata.adapter';
import type { ImageMetadataPort } from '../../src/application/ports/image-metadata.port';

describe('ImageMetadataPort contract', () => {
  function expectMetadataPortContract(port: ImageMetadataPort): void {
    expect(typeof port.extractTimestamp).toBe('function');
  }

  it('exposes timestamp extraction and returns normalized metadata time', async () => {
    const port = new ImageMetadataAdapter();
    const fixturePath = path.join(
      process.cwd(),
      'tests/fixtures/images/2026-05-19 06-05-20.JPG',
    );

    expectMetadataPortContract(port);
    await expect(
      port.extractTimestamp({
        imageId: '2026-05-19 06-05-20',
        imagePath: fixturePath,
        data: readFileSync(fixturePath),
      }),
    ).resolves.toMatchObject({
      time: '2026-05-19 06:05:20',
      issues: [],
    });
  });
});
