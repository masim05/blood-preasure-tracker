import { validateUploadImage } from '../../../src/domain/services/upload-image-policy';
import { jpegBytes, pngBytes } from '../../helpers/image-bytes';

describe('upload image policy', () => {
  it('accepts JPEG and PNG up to 10 MB', () => {
    expect(validateUploadImage({ contentType: 'image/jpeg', byteSize: jpegBytes.byteLength, data: jpegBytes })).toBe('image/jpeg');
    expect(validateUploadImage({ contentType: 'image/png', byteSize: pngBytes.byteLength, data: pngBytes })).toBe('image/png');
  });

  it('rejects empty, oversized, and unsupported files', () => {
    expect(() => validateUploadImage({ contentType: 'image/jpeg', byteSize: 0 })).toThrow('image must not be empty');
    expect(() => validateUploadImage({ contentType: 'image/png', byteSize: 10 * 1024 * 1024 + 1 })).toThrow('image must be at most 10 MB');
    expect(() => validateUploadImage({ contentType: 'image/gif', byteSize: 10 })).toThrow('image must be JPEG or PNG');
  });

  it('rejects image content that does not match the declared content type', () => {
    expect(() => validateUploadImage({ contentType: 'image/png', byteSize: jpegBytes.byteLength, data: jpegBytes })).toThrow('image content does not match content type');
  });
});
