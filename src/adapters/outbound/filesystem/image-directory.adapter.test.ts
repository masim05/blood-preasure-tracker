import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { ImageDirectoryAdapter } from './image-directory.adapter';

describe('ImageDirectoryAdapter', () => {
  it('loads only supported image files and skips directories plus unsupported files', async () => {
    const adapter = new ImageDirectoryAdapter();
    const directory = mkdtempSync(path.join(tmpdir(), 'bp-images-'));

    mkdirSync(path.join(directory, 'nested'));
    writeFileSync(path.join(directory, 'ignore.txt'), 'ignored');
    writeFileSync(path.join(directory, 'img001.jpg'), 'fixture-image');
    writeFileSync(path.join(directory, 'IMG002.JPG'), 'fixture-image');

    const images = await adapter.load(directory);

    expect(images).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          imageId: 'img001',
          contentType: 'image/jpeg',
        }),
        expect.objectContaining({
          imageId: 'IMG002',
          contentType: 'image/jpeg',
        }),
      ]),
    );
    expect(images).toHaveLength(2);
  });
});