import type { ModelCatalogPort, ProviderModelCatalog } from '../ports/model-catalog.port';

export class ListModelsUseCase {
  constructor(private readonly modelCatalog: ModelCatalogPort) {}

  execute(): ProviderModelCatalog[] {
    return this.modelCatalog.list();
  }
}