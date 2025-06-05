import type { BlobTileset, TilesetConfig } from "../types";

export const generateTileset = (config: TilesetConfig): BlobTileset[] => {
  if (!config.maskImage || !config.textureImage) {
    return [];
  }

  const blobTilesets: BlobTileset[] = [];
  const sourceCanvas = document.createElement("canvas");
  const sourceCtx = sourceCanvas.getContext("2d")!;

  // Set source canvas size to match the texture image
  sourceCanvas.width = config.textureImage.width;
  sourceCanvas.height = config.textureImage.height;

  // Draw texture image to source canvas
  sourceCtx.drawImage(config.textureImage, 0, 0);

  // Create a working canvas for the expanded texture
  const workCanvas = document.createElement("canvas");
  workCanvas.width = 128; // 8 tiles wide
  workCanvas.height = 96; // 6 tiles high
  const workCtx = workCanvas.getContext("2d")!;

  // Create a mask canvas with the same size as the work canvas
  const maskCanvas = document.createElement("canvas");
  maskCanvas.width = workCanvas.width;
  maskCanvas.height = workCanvas.height;
  const maskCtx = maskCanvas.getContext("2d")!;

  // Draw the mask once
  maskCtx.drawImage(config.maskImage, 0, 0);
  const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

  // For each tile in the source texture
  for (let baseY = 0; baseY < sourceCanvas.height; baseY += config.tileSize) {
    for (let baseX = 0; baseX < sourceCanvas.width; baseX += config.tileSize) {
      // Get the current tile data
      const tileData = sourceCtx.getImageData(
        baseX,
        baseY,
        config.tileSize,
        config.tileSize
      );

      // Create temporary canvas for the single tile
      const tileCanvas = document.createElement("canvas");
      tileCanvas.width = config.tileSize;
      tileCanvas.height = config.tileSize;
      const tileCtx = tileCanvas.getContext("2d")!;
      tileCtx.putImageData(tileData, 0, 0);

      // Clear work canvas
      workCtx.clearRect(0, 0, workCanvas.width, workCanvas.height);

      // Fill work canvas with repeated tile
      for (let y = 0; y < workCanvas.height; y += config.tileSize) {
        for (let x = 0; x < workCanvas.width; x += config.tileSize) {
          workCtx.drawImage(tileCanvas, x, y);
        }
      }

      // Get the expanded tileset data
      const expandedData = workCtx.getImageData(0, 0, workCanvas.width, workCanvas.height);
      
      // Create the final blob tileset by applying the mask
      const finalData = new ImageData(
        new Uint8ClampedArray(expandedData.data.length),
        expandedData.width,
        expandedData.height
      );

      // Apply mask by converting grayscale to alpha
      for (let i = 0; i < expandedData.data.length; i += 4) {
        // Get the grayscale value from the mask (using red channel as they're all the same in grayscale)
        const maskGray = maskData.data[i];
        
        // Copy RGB from the expanded texture
        finalData.data[i] = expandedData.data[i];         // R
        finalData.data[i + 1] = expandedData.data[i + 1]; // G
        finalData.data[i + 2] = expandedData.data[i + 2]; // B
        
        // Set alpha based on mask's grayscale value (white = opaque, black = transparent)
        finalData.data[i + 3] = maskGray;
      }

      blobTilesets.push({
        sourceX: baseX,
        sourceY: baseY,
        data: finalData
      });
    }
  }

  return blobTilesets;
};

export const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};
