import { Injectable } from '@nestjs/common';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import type { ImageSourcePort, SourceImage } from '../../../application/ports/image-source.port';

const supportedExtensions = new Map<string, string>([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp'],
]);

@Injectable()
export class ImageDirectoryAdapter implements ImageSourcePort {
  async load(inputDirectory: string): Promise<SourceImage[]> {
    const entries = await readdir(inputDirectory, { withFileTypes: true });
    const images: SourceImage[] = [];

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const imagePath = path.join(inputDirectory, entry.name);
      const extension = path.extname(entry.name).toLowerCase();
      const contentType = supportedExtensions.get(extension);

      if (!contentType) {
        continue;
      }

      images.push({
        imageId: path.parse(entry.name).name,
        imagePath,
        contentType,
        data: await readFile(imagePath),
      });
    }

    return images;
  }
}