export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export type AcceptedImageContentType = 'image/jpeg' | 'image/png';

export type UploadImageInput = {
  contentType: string;
  byteSize: number;
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

  return input.contentType;
}
