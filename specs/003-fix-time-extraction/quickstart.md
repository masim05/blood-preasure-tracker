# Quickstart: Fix Time Extraction

## Prerequisites

```bash
npm install
```

Use the normal provider configuration for value extraction. The timestamp fix does not change provider credentials or model selection.

## Reproduce the Bug Case

Confirm the image has embedded metadata:

```bash
file "data/eval/2026-05-19 06-05-20.JPG"
```

The important part of the output is:

```text
datetime=2026:05:19 06:05:20
```

Run prediction:

```bash
npm run cli -- predict --input ./data/eval
```

Expected JSONL behavior after the fix:

```json
{"type":"prediction","imageId":"2026-05-19 06-05-20.JPG","time":"2026-05-19 06:05:20"}
```

Other provider-derived fields may vary by model response, but `time` must be non-null for the metadata-bearing image.
The provider response is not used as a timestamp source.

## Evaluate Timestamp Matching

Use a CSV row with the normalized timestamp:

```csv
imageId,time,hand,systolic,diastolic,pulse
2026-05-19 06-05-20,2026-05-19 06:05:20,left,121,75,75
```

Run evaluation:

```bash
npm run cli -- eval --input ./data/eval --csv ./data/eval/a.csv
```

The timestamp comparison should match when the embedded metadata normalizes to the CSV value.

## Missing Metadata Check

Run `predict` against a fixture without supported embedded timestamp metadata. Expected behavior:

- `time` remains `null`
- `uncertainFields` includes `time` for non-error records
- no filename, provider, or file modification timestamp fallback is used

## Validation Commands

```bash
npm run build
npm test
npm run test:coverage
npm run lint
npm run cli -- predict --input ./data/eval
npm run cli -- eval --input ./data/eval --csv ./data/eval/a.csv
```

Coverage must remain at or above 95% overall, with changed timestamp extraction branches covered directly.
The automated test suite includes the committed fixture `tests/fixtures/images/2026-05-19 06-05-20.JPG` so timestamp validation can run without depending on ignored local `data/` files.
