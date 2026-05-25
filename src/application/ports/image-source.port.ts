export type SourceImage = {
  imageId: string;
  imagePath: string;
  contentType: string;
  data: Buffer;
};

export interface ImageSourcePort {
  load(inputDirectory: string): Promise<SourceImage[]>;
}