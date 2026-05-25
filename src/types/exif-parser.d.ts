declare module 'exif-parser' {
  export type ExifParseResult = {
    tags: Record<string, unknown>;
  };

  export type ExifParser = {
    parse(): ExifParseResult;
  };

  export function create(buffer: Buffer): ExifParser;
}
