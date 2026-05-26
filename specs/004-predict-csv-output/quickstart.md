# Quickstart: Predict CSV Output

## Prerequisites

```bash
npm install
export OPENAI_API_KEY="your-key"
```

Use the same provider/model configuration already supported by the CLI.

## Generate `p.csv`

Run prediction for an image directory:

```bash
npm run cli -- predict --input ./data/eval
```

Expected side effects:

- JSONL prediction records are still emitted to the normal command output.
- `./data/eval/p.csv` is created or replaced.
- The CSV header is written before image processing rows.
- One row is streamed as each image is processed.

Expected header:

```csv
imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes
```

## Check Null And Uncertainty Encoding

Rows with missing values use empty cells. `uncertainFields` is encoded as a JSON array string in one CSV cell:

```csv
imageId,time,hand,systolic,diastolic,pulse,status,confidence,uncertainFields,provider,model,rawNotes
img001,,right,127,72,69,partial,0.82,"[""time""]",openai,gpt-5.4-mini,No supported embedded timestamp metadata found
```

## Reuse `p.csv` In Eval

Run eval with the generated CSV:

```bash
npm run cli -- eval --input ./data/eval --csv ./data/eval/p.csv
```

Expected behavior:

- Eval accepts the generated CSV without editing.
- Eval treats `p.csv` as reference data.
- Eval runs fresh predictions for `./data/eval`.
- Eval compares fresh prediction values against the core columns in `p.csv`.
- Service columns are ignored by eval parsing.

## Empty Directory Check

Run predict against a directory with no supported images:

```bash
npm run cli -- predict --input ./tmp/empty-images
```

Expected behavior:

- `./tmp/empty-images/p.csv` exists.
- The file contains only the header row.

## Validation Commands

```bash
npm run build
npm test
npm run test:coverage
npm run lint
npm run cli -- predict --input ./data/eval
npm run cli -- eval --input ./data/eval --csv ./data/eval/p.csv
```

Coverage must remain at or above 95% overall, with changed CSV writer, parser, and predict orchestration branches covered directly.
