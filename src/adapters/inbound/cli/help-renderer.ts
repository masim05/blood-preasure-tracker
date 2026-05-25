import { Injectable } from '@nestjs/common';

import type { ModelCatalogPort } from '../../../application/ports/model-catalog.port';

@Injectable()
export class HelpRenderer {
  render(modelCatalog: ModelCatalogPort): string {
    const availableModels = modelCatalog
      .list()
      .map((catalog) => `${catalog.provider}: ${catalog.models.join(', ')}`)
      .join('\n');

    return [
      'Usage: npm run cli -- <predict|eval> [options]',
      '',
      'Commands:',
      '  predict   Predict blood pressure values from images',
      '  eval      Compare predictions against a CSV dataset',
      '',
      'Options:',
      '  --input <path>     Override input directory',
      '  --csv <path>       Override evaluation CSV path',
      '  --provider <name>  Choose LLM provider',
      '  --model <name>     Choose model',
      '  --help             Show this help message',
      '',
      'Defaults: input=data/eval csv=data/eval/a.csv provider=openai',
      '',
      'Available models:',
      availableModels,
      '',
    ].join('\n');
  }
}