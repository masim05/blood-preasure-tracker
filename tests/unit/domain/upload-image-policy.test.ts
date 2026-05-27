import { validateUploadImage } from '../../../src/domain/services/upload-image-policy';

describe('upload image policy', () => {
  it('accepts JPEG and PNG up to 10 MB', () => {
    expect(validateUploadImage({ contentType: 'image/jpeg', byteSize: 1 })).toBe('image/jpeg');
    expect(validateUploadImage({ contentType: 'image/png', byteSize: 10 * 1024 * 1024 })).toBe('image/png');
  });

  it('rejects empty, oversized, and unsupported files', () => {
    expect(() => validateUploadImage({ contentType: 'image/jpeg', byteSize: 0 })).toThrow('image must not be empty');
    expect(() => validateUploadImage({ contentType: 'image/png', byteSize: 10 * 1024 * 1024 + 1 })).toThrow('image must be at most 10 MB');
    expect(() => validateUploadImage({ contentType: 'image/gif', byteSize: 10 })).toThrow('image must be JPEG or PNG');
  });
});
