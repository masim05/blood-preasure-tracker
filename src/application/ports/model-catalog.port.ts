export type ProviderModelCatalog = {
  provider: string;
  models: string[];
  defaultModel: string;
  available: boolean;
};

export interface ModelCatalogPort {
  list(): ProviderModelCatalog[];
  getDefaultModel(provider: string): string;
}