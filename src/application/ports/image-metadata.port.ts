export type MetadataTimestampSourceTag = 'DateTimeOriginal' | 'CreateDate' | 'DateTime';

export type ImageMetadataRequest = {
  imageId: string;
  imagePath: string;
  data: Buffer;
};

export type TimestampExtractionResult = {
  imageId: string;
  imagePath: string;
  time: string | null;
  sourceTag: MetadataTimestampSourceTag | null;
  rawValue: string | null;
  issues: string[];
};

export interface ImageMetadataPort {
  extractTimestamp(request: ImageMetadataRequest): Promise<TimestampExtractionResult>;
}
