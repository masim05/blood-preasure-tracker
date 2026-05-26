export interface OutputWriterPort {
  write(record: unknown): Promise<void>;
  writeText?(text: string): Promise<void>;
  flush?(): Promise<void>;
}