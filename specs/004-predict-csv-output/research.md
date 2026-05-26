# Research: Predict CSV Output

## Decision: Add a prediction CSV writer port and filesystem adapter

**Rationale**: The existing architecture separates use cases from concrete output adapters. A dedicated `PredictionCsvWriterPort` keeps the predict use case responsible for orchestration only while the filesystem adapter owns path resolution, file replacement, CSV escaping, streaming, backpressure, and close behavior.

**Alternatives considered**:

- Write `p.csv` directly inside `PredictImagesUseCase`: rejected because it would couple application orchestration to filesystem details and violate hexagonal boundaries.
- Reuse `OutputWriterPort`: rejected because the existing port represents JSONL command output records, while `p.csv` has a fixed durable artifact lifecycle with header, row, and close semantics.

## Decision: Use Node.js built-in file and stream APIs for CSV writing

**Rationale**: The generated schema is fixed and small. Correct CSV generation requires deterministic escaping for commas, quotes, and line breaks, which can be implemented locally and covered with unit tests. Node.js built-ins provide file replacement and streaming without introducing a new dependency.

**Alternatives considered**:

- Add a third-party CSV writer: rejected because official Node.js APIs are sufficient for the fixed schema and the constitution prefers built-in modules unless a third-party library is justified.
- Buffer all rows and write at the end: rejected because the clarified requirement is to stream rows as each image is processed.

## Decision: Replace stale `p.csv` at the start of each predict run

**Rationale**: Replacing the file before streaming avoids appending stale rows from earlier runs and gives users immediate visibility that a new artifact is being produced. The header row should be written before processing images, so an empty input directory still produces a valid header-only file.

**Alternatives considered**:

- Append to existing `p.csv`: rejected because it mixes runs and violates the requirement that each run represents current predictions only.
- Write to a temporary file and rename at completion: rejected because the clarified requirement is row streaming during the run, not all-at-end materialization.

## Decision: Encode `uncertainFields` as a JSON array string in a CSV cell

**Rationale**: JSON preserves the exact ordered list of uncertain fields without inventing delimiter escaping rules. Standard CSV escaping handles the embedded quotes safely, and eval ignores the service column for compatibility.

**Alternatives considered**:

- Pipe-delimited strings: rejected because delimiter collisions require a second escaping convention.
- Separate boolean columns: rejected because it expands the schema and makes future fields harder to represent.

## Decision: Write null values as empty CSV cells

**Rationale**: Empty cells are conventional for missing CSV values and align with the existing CSV dataset parser's nullable field behavior. This keeps generated `p.csv` files readable and compatible with eval's core column parser.

**Alternatives considered**:

- Literal `null`: rejected because it would require parser special-casing and can be confused with actual text.
- `NA`: rejected because it is a domain-specific placeholder not currently used by the dataset format.

## Decision: Eval treats generated `p.csv` as reference data

**Rationale**: The existing `eval --csv` contract accepts a CSV reference dataset and runs fresh predictions against input images. Keeping that semantic avoids adding a cached-prediction execution mode and lets generated `p.csv` files act as a reusable baseline/reference artifact.

**Alternatives considered**:

- Reuse predictions from `p.csv` without provider calls: rejected because it changes the meaning of `eval` and would require a second evaluation path.
- Self-comparison summaries: rejected because they provide little value and do not match the current eval contract.
