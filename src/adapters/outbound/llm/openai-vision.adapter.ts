import OpenAI from 'openai';

import type {
  LlmProviderPort,
  LlmProviderRequest,
  LlmProviderResponse,
} from '../../../application/ports/llm-provider.port';

type OpenAiVisionAdapterOptions = {
  apiKey: string;
  model: string;
  client?: OpenAI;
};

const uncertainProviderFields = ['hand', 'systolic', 'diastolic', 'pulse'] as const;
const uncertainProviderFieldSet = new Set<string>(uncertainProviderFields);

export class OpenAiVisionAdapter implements LlmProviderPort {
  readonly provider = 'openai';

  private readonly client: OpenAI;
  private readonly model: string;

  constructor(options: OpenAiVisionAdapterOptions) {
    this.client = options.client ?? new OpenAI({ apiKey: options.apiKey });
    this.model = options.model;
  }

  async infer(request: LlmProviderRequest): Promise<LlmProviderResponse> {
    const response = await this.client.responses.create({
      model: request.model || this.model,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Extract blood pressure monitor values and return structured JSON.',
            },
            {
              type: 'input_image',
              image_url: `data:${request.contentType};base64,${request.data.toString('base64')}`,
              detail: 'auto',
            },
          ],
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'blood_pressure_reading',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              hand: { enum: ['left', 'right', 'unknown', null] },
              systolic: { type: ['number', 'null'] },
              diastolic: { type: ['number', 'null'] },
              pulse: { type: ['number', 'null'] },
              confidence: { type: ['number', 'null'] },
              uncertainFields: {
                type: 'array',
                items: { type: 'string' },
              },
              rawNotes: { type: ['string', 'null'] },
            },
            required: [
              'hand',
              'systolic',
              'diastolic',
              'pulse',
              'confidence',
              'uncertainFields',
              'rawNotes',
            ],
          },
        },
      },
    });

    const parsed = parseProviderResponse(response.output_text);

    return {
      hand: parsed.hand === 'left' || parsed.hand === 'right' || parsed.hand === 'unknown' ? parsed.hand : null,
      systolic: parsed.systolic,
      diastolic: parsed.diastolic,
      pulse: parsed.pulse,
      confidence: parsed.confidence,
      uncertainFields: parsed.uncertainFields,
      rawNotes: parsed.rawNotes,
    };
  }
}

function parseProviderResponse(outputText: string): LlmProviderResponse & { hand: string | null } {
  try {
    const parsed = JSON.parse(outputText) as Partial<LlmProviderResponse> & { hand?: unknown };

    const rawUncertainFields = parsed.uncertainFields;
    const uncertainFields = Array.isArray(rawUncertainFields)
      ? rawUncertainFields.filter(
          (field): field is string => typeof field === 'string' && uncertainProviderFieldSet.has(field),
        )
      : [];

    return {
      hand: typeof parsed.hand === 'string' || parsed.hand === null ? parsed.hand : null,
      systolic: typeof parsed.systolic === 'number' ? parsed.systolic : null,
      diastolic: typeof parsed.diastolic === 'number' ? parsed.diastolic : null,
      pulse: typeof parsed.pulse === 'number' ? parsed.pulse : null,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : null,
      uncertainFields: toProviderUncertainFields(rawUncertainFields, uncertainFields),
      rawNotes: typeof parsed.rawNotes === 'string' || parsed.rawNotes === null ? parsed.rawNotes : null,
    };
  } catch (error) {
    return {
      hand: null,
      systolic: null,
      diastolic: null,
      pulse: null,
      confidence: null,
      uncertainFields: [...uncertainProviderFields],
      rawNotes: error instanceof Error ? `Unable to parse provider response: ${error.message}` : 'Unable to parse provider response',
    };
  }
}

function toProviderUncertainFields(rawValue: unknown, filteredFields: string[]): string[] {
  if (!Array.isArray(rawValue)) {
    return [...uncertainProviderFields];
  }

  if (rawValue.length === 0) {
    return [];
  }

  return filteredFields.length > 0 ? filteredFields : [...uncertainProviderFields];
}