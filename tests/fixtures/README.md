# Test Fixtures

## Images

- `images/2026-05-19 06-05-20.JPG`: JPEG fixture from the reported bug case. Its embedded EXIF/TIFF metadata includes `DateTime=2026:05:19 06:05:20` and should normalize to `2026-05-19 06:05:20`.
- Metadata-missing cases should use generated temporary images in tests unless a small committed fixture is needed.

Timestamp tests must not use filename text, provider output, runtime timezone, or file modification time as fallback sources.
