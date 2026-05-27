export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export type AcceptedImageContentType = 'image/jpeg' | 'image/png';

export type UploadImageInput = {
  contentType: string;
  byteSize: number;
  data?: Buffer;
};

export function validateUploadImage(input: UploadImageInput): AcceptedImageContentType {
  if (input.byteSize <= 0) {
    throw new Error('image must not be empty');
  }
  if (input.byteSize > MAX_UPLOAD_BYTES) {
    throw new Error('image must be at most 10 MB');
  }
  if (input.contentType !== 'image/jpeg' && input.contentType !== 'image/png') {
    throw new Error('image must be JPEG or PNG');
  }
  if (input.data && !contentMatchesType(input.contentType, input.data)) {
    throw new Error('image content does not match content type');
  }

  return input.contentType;
}

function contentMatchesType(contentType: AcceptedImageContentType, data: Buffer): boolean {
  if (contentType === 'image/jpeg') {
    return data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }

  return (
    data.length >= 8 &&
    data[0] === 0x89 &&
    data[1] === 0x50 &&
    data[2] === 0x4e &&
    data[3] === 0x47 &&
    data[4] === 0x0d &&
    data[5] === 0x0a &&
    data[6] === 0x1a &&
    data[7] === 0x0a
  );
}
