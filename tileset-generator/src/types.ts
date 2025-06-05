export interface TilesetConfig {
  tileSize: number;
  maskImage: HTMLImageElement | null;
  textureImage: HTMLImageElement | null;
}

export interface BlobTileset {
  sourceX: number;
  sourceY: number;
  data: ImageData;
}

export interface Tile {
  x: number;
  y: number;
  width: number;
  height: number;
  data: ImageData;
  blobType: number;
} 