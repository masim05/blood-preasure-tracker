export type LlmProviderRequest = {
  imageId: string;
  imagePath: string;
  contentType: string;
  data: Buffer;
  model: string;
};

export type LlmProviderResponse = {
  time: string | null;
  hand: 'left' | 'right' | 'unknown' | null;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  confidence: number | null;
  uncertainFields: string[];
  rawNotes: string | null;
};

export interface LlmProviderPort {
  readonly provider: string;
  infer(request: LlmProviderRequest): Promise<LlmProviderResponse>;
}