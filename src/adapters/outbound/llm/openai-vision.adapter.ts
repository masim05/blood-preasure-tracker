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
              time: { type: ['string', 'null'] },
              hand: { type: ['string', 'null'] },
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
              'time',
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

    const outputText = response.output_text;
    const parsed = JSON.parse(outputText) as LlmProviderResponse & { hand: string | null };

    return {
      time: parsed.time,
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