export interface OutputWriterPort {
  write(record: unknown): Promise<void>;
  flush?(): Promise<void>;
}