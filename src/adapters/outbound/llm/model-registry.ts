import { Injectable } from '@nestjs/common';

import type {
  ModelCatalogPort,
  ProviderModelCatalog,
} from '../../../application/ports/model-catalog.port';

@Injectable()
export class ModelRegistry implements ModelCatalogPort {
  private readonly catalogs: ProviderModelCatalog[] = [
    {
      provider: 'openai',
      models: ['gpt-5.4-mini'],
      defaultModel: 'gpt-5.4-mini',
      available: true,
    },
  ];

  list(): ProviderModelCatalog[] {
    return this.catalogs.map((catalog) => ({
      ...catalog,
      models: [...catalog.models],
    }));
  }

  getDefaultModel(provider: string): string {
    const catalog = this.catalogs.find((entry) => entry.provider === provider);
    if (!catalog) {
      throw new Error(`No model catalog configured for provider ${provider}`);
    }

    return catalog.defaultModel;
  }
}