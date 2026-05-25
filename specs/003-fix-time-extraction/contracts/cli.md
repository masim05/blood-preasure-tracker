# CLI Contract: Fix Time Extraction

## Scope

This contract describes observable CLI behavior for the timestamp extraction bug fix. Existing `predict` and `eval` commands remain in place.

## `predict`

### Predict Command

```bash
npm run cli -- predict --input ./data/eval
```

### Timestamp Source

- `time` MUST come only from embedded image metadata.
- Supported metadata tag precedence is `DateTimeOriginal`, then `CreateDate`, then generic `DateTime`.
- EXIF-style values such as `2026:05:19 06:05:20` MUST be emitted as `2026-05-19 06:05:20`.
- The CLI MUST NOT use provider output, filename text, file modification time, or runtime timezone inference as fallback.

### Prediction Record

```json
{
  "type": "prediction",
  "imageId": "2026-05-19 06-05-20.JPG",
  "imagePath": "data/eval/2026-05-19 06-05-20.JPG",
  "time": "2026-05-19 06:05:20",
  "hand": "left",
  "systolic": 121,
  "diastolic": 75,
  "pulse": 75,
  "confidence": 0.98,
  "status": "complete",
  "uncertainFields": [],
  "provider": "openai",
  "model": "gpt-5.4-mini",
  "rawNotes": "Provider-derived notes may be present."
}
```

### Missing or Invalid Metadata

If no supported embedded timestamp is available, the prediction keeps processing and emits:

```json
{
  "type": "prediction",
  "imageId": "missing-time.JPG",
  "time": null,
  "uncertainFields": ["time"]
}
```

The record may include other fields as usual. `time` uncertainty is omitted only when the whole record is already in `error` state.

## `eval`

### Eval Command

```bash
npm run cli -- eval --input ./data/eval --csv ./data/eval/a.csv
```

### Timestamp Comparison

- Ground-truth `time` values are compared against the metadata-derived prediction `time`.
- A CSV row expecting `2026-05-19 06:05:20` matches an image whose embedded timestamp normalizes to `2026-05-19 06:05:20`.
- Missing or invalid metadata is reported through existing comparison and summary output without inventing a replacement timestamp.

## Compatibility

- Provider-backed extraction for `hand`, `systolic`, `diastolic`, and `pulse` is unchanged.
- CSV filename-stem matching is unchanged.
- JSONL record types remain `prediction`, `comparison`, and `summary`.
- Environment variables and provider credentials are unchanged.
