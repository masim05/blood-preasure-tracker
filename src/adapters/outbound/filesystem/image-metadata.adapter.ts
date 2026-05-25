import { Injectable } from '@nestjs/common';
import { create as createExifParser } from 'exif-parser';

import type {
  ImageMetadataPort,
  ImageMetadataRequest,
  TimestampExtractionResult,
} from '../../../application/ports/image-metadata.port';
import { selectMetadataTimestamp } from '../../../domain/services/metadata-timestamp-policy';

@Injectable()
export class ImageMetadataAdapter implements ImageMetadataPort {
  async extractTimestamp(request: ImageMetadataRequest): Promise<TimestampExtractionResult> {
    try {
      const parsed = createExifParser(request.data).parse();
      const candidate = selectMetadataTimestamp(parsed.tags);

      if (!candidate) {
        return missingTimestamp(request, 'No supported embedded timestamp metadata found');
      }

      return {
        imageId: request.imageId,
        imagePath: request.imagePath,
        time: candidate.normalizedValue,
        sourceTag: candidate.sourceTag,
        rawValue: candidate.rawValue,
        issues: [],
      };
    } catch (error) {
      return missingTimestamp(
        request,
        error instanceof Error
          ? `Unable to read embedded timestamp metadata: ${error.message}`
          : 'Unable to read embedded timestamp metadata',
      );
    }
  }
}

function missingTimestamp(request: ImageMetadataRequest, issue: string): TimestampExtractionResult {
  return {
    imageId: request.imageId,
    imagePath: request.imagePath,
    time: null,
    sourceTag: null,
    rawValue: null,
    issues: [issue],
  };
}
