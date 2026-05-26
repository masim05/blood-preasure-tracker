# Research: Fix Time Extraction

## Decision 1: Extract timestamps through an image metadata port

**Decision**: Introduce `ImageMetadataPort` and a filesystem metadata adapter for all timestamp extraction.

**Rationale**: The bug exists because `time` is currently supplied by the provider inference path. A dedicated metadata port makes the allowed timestamp source explicit and keeps EXIF parsing out of domain and orchestration logic.

**Alternatives considered**:

- Parse EXIF directly inside `PredictImagesUseCase`: rejected because it leaks filesystem/parsing concerns into application orchestration.
- Keep provider-owned `time` and override it later: rejected because it leaves an unsafe contract that can regress.

## Decision 2: Use `exif-parser` for EXIF/TIFF timestamp tags

**Decision**: Add/use `exif-parser` to read embedded timestamp metadata from image buffers.

**Rationale**: Node.js and NestJS provide no official EXIF parser. `exif-parser` is focused enough for CLI metadata extraction and avoids a heavier image-processing dependency.

**Alternatives considered**:

- Hand-roll JPEG/TIFF parsing: rejected because EXIF parsing edge cases would add fragile maintenance risk.
- Use file modification time: rejected because it is filesystem metadata, not embedded image metadata.

## Decision 3: Apply explicit timestamp tag precedence

**Decision**: When multiple supported timestamp tags exist, use `DateTimeOriginal`, then `CreateDate`, then generic `DateTime`.

**Rationale**: `DateTimeOriginal` is the strongest representation of capture time, `CreateDate` is a useful creation fallback, and generic `DateTime` fixes the reported Samsung/file-command case while remaining lower precedence.

**Alternatives considered**:

- Generic `DateTime` first: rejected because it may be less specific than original capture time when both exist.
- Parser iteration order: rejected because it is not a stable product contract.

## Decision 4: Normalize timestamps to `YYYY-MM-DD HH:mm:ss`

**Decision**: Convert supported EXIF `YYYY:MM:DD HH:MM:SS` values into `YYYY-MM-DD HH:mm:ss` for predict/eval output.

**Rationale**: This matches the clarified spec, keeps CSV comparisons predictable, and avoids timezone invention.

**Alternatives considered**:

- Preserve raw EXIF text: rejected because current CLI examples and ground-truth CSV use the normalized dash-separated shape.
- Emit ISO timestamps with `T`: rejected because that would change the user-facing contract beyond the bug fix.

## Decision 5: Preserve null and uncertainty for missing or invalid metadata

**Decision**: If supported embedded timestamp metadata is absent, unreadable, malformed, or unsupported, emit `time: null` and include `time` in uncertainty unless the whole record is already in `error` state.

**Rationale**: The feature must fix present metadata extraction without inventing timestamps from providers, filenames, runtime timezone, or file mtime.

**Alternatives considered**:

- Infer time from filename text: rejected because filenames are not embedded image metadata.
- Infer time from provider output: rejected because the system must not use model output for `time`.
