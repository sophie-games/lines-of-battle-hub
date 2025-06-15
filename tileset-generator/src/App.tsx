import React, { useState, useCallback, useRef, useEffect } from "react";
import type { BlobTileset, TilesetConfig } from "./types";
import { generateTileset, loadImage } from "./utils/tilesetGenerator";
import JSZip from "jszip";

function App() {
  const [config, setConfig] = useState<TilesetConfig>({
    tileSize: 16,
    maskImage: null,
    textureImage: null,
    overlayImage: null,
  });

  const [blobTilesets, setBlobTilesets] = useState<BlobTileset[]>([]);
  const [namePrefix, setNamePrefix] = useState<string>("snow");
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  // Load default images on component mount
  useEffect(() => {
    // Load default blob mask
    loadImage("/blob-mask.webp")
      .then((image) => {
        setConfig((prev) => ({
          ...prev,
          maskImage: image,
        }));
      })
      .catch((error) => {
        console.error("Error loading default mask:", error);
      });

    // Load default snow texture
    loadImage("/snow-texture.webp")
      .then((image) => {
        setConfig((prev) => ({
          ...prev,
          textureImage: image,
        }));
      })
      .catch((error) => {
        console.error("Error loading default texture:", error);
      });
  }, []);

  const handleImageUpload = useCallback(
    async (
      e: React.ChangeEvent<HTMLInputElement>,
      type: "mask" | "texture" | "overlay"
    ) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
        const imageUrl = URL.createObjectURL(file);
        const image = await loadImage(imageUrl);

        setConfig((prev) => ({
          ...prev,
          [type === "mask" ? "maskImage" : type === "texture" ? "textureImage" : "overlayImage"]: image,
        }));
      } catch (error) {
        console.error("Error loading image:", error);
      }
    },
    []
  );

  const generateBlobTilesets = useCallback(() => {
    const newBlobTilesets = generateTileset(config);
    setBlobTilesets(newBlobTilesets);
    // Ensure we have enough canvas refs
    canvasRefs.current = new Array(newBlobTilesets.length).fill(null);
  }, [config]);

  useEffect(() => {
    if (blobTilesets.length === 0) return;

    blobTilesets.forEach((blobTileset, index) => {
      const canvas = canvasRefs.current[index];
      if (!canvas) return;

      const ctx = canvas.getContext("2d")!;
      canvas.width = 128; // 8 tiles wide
      canvas.height = 96; // 6 tiles high

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw blob tileset
      ctx.putImageData(blobTileset.data, 0, 0);
    });
  }, [blobTilesets]);

  const getBlobName = useCallback(
    (blobTileset: BlobTileset) => {
      const x = Math.floor(blobTileset.sourceX / config.tileSize);
      const y = Math.floor(blobTileset.sourceY / config.tileSize);
      return `${namePrefix}${x}_${y}`;
    },
    [namePrefix, config]
  );

  const downloadBlobTileset = useCallback(
    async (blobTileset: BlobTileset, index: number) => {
      const canvas = canvasRefs.current[index];
      if (!canvas) return;

      // Convert canvas to blob with webp format
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp");
      });

      if (!blob) {
        console.error("Failed to create blob");
        return;
      }

      const link = document.createElement("a");
      link.download = `${getBlobName(blobTileset)}.webp`;
      link.href = URL.createObjectURL(blob);
      link.click();
      URL.revokeObjectURL(link.href);
    },
    [namePrefix, getBlobName]
  );

  const downloadAllBlobTilesets = useCallback(async () => {
    const zip = new JSZip();

    // Create promises for all blob conversions
    const promises = blobTilesets.map(async (blobTileset, index) => {
      const canvas = canvasRefs.current[index];
      if (!canvas) return;

      // Convert canvas to blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/webp");
      });

      if (!blob) {
        console.error("Failed to create blob");
        return;
      }

      const fileName = `${getBlobName(blobTileset)}.webp`;
      zip.file(fileName, blob);
    });

    // Wait for all blobs to be added to the zip
    await Promise.all(promises);

    // Generate zip file
    const zipBlob = await zip.generateAsync({ type: "blob" });

    // Create download link
    const link = document.createElement("a");
    link.download = `${namePrefix}_tilesets.zip`;
    link.href = URL.createObjectURL(zipBlob);
    link.click();
    URL.revokeObjectURL(link.href);
  }, [blobTilesets, canvasRefs, getBlobName, namePrefix]);

  return (
    <div className="w-full h-full flex flex-col items-center p-5 gap-5 min-h-screen bg-gray-900 text-gray-100">
      <h1 className="text-4xl font-bold text-white">Blob Tileset Generator</h1>

      <div className="flex gap-5 mb-5">
        <div className="flex flex-col gap-2">
          <label className="text-gray-300">Mask Image: </label>
          <div className="flex flex-col gap-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "mask")}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-700 file:text-gray-100 hover:file:bg-gray-600 file:cursor-pointer text-gray-300"
            />
            <span className="text-xs text-gray-400">
              Default: blob-mask.webp
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-gray-300">Texture Image: </label>
          <div className="flex flex-col gap-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "texture")}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-700 file:text-gray-100 hover:file:bg-gray-600 file:cursor-pointer text-gray-300"
            />
            <span className="text-xs text-gray-400">
              Default: snow-texture.webp
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-gray-300">Overlay Image: </label>
          <div className="flex flex-col gap-1">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, "overlay")}
              className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gray-700 file:text-gray-100 hover:file:bg-gray-600 file:cursor-pointer text-gray-300"
            />
            <span className="text-xs text-gray-400">
              Optional overlay image
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-gray-300">Name Prefix: </label>
          <input
            type="text"
            value={namePrefix}
            onChange={(e) => setNamePrefix(e.target.value)}
            placeholder="Enter name prefix"
            className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-5 mb-5">
        {config.maskImage && (
          <div>
            <h3 className="text-xl mb-2 text-gray-200">Mask Preview</h3>
            <img
              src={config.maskImage.src}
              alt="Mask"
              className="max-w-[200px] max-h-[200px] object-contain bg-gray-800 rounded-lg p-2"
            />
          </div>
        )}
        {config.textureImage && (
          <div>
            <h3 className="text-xl mb-2 text-gray-200">Texture Preview</h3>
            <img
              src={config.textureImage.src}
              alt="Texture"
              className="max-w-[200px] max-h-[200px] object-contain bg-gray-800 rounded-lg p-2"
            />
          </div>
        )}
        {config.overlayImage && (
          <div>
            <h3 className="text-xl mb-2 text-gray-200">Overlay Preview</h3>
            <img
              src={config.overlayImage.src}
              alt="Overlay"
              className="max-w-[200px] max-h-[200px] object-contain bg-gray-800 rounded-lg p-2"
            />
          </div>
        )}
      </div>

      <button
        onClick={generateBlobTilesets}
        disabled={!config.maskImage || !config.textureImage}
        className="rounded-lg border border-transparent px-4 py-2 text-base font-medium bg-gray-700 text-gray-100 cursor-pointer transition-colors hover:bg-gray-600 hover:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700 disabled:hover:border-transparent"
      >
        Generate Blob Tilesets
      </button>

      {blobTilesets.length > 0 && (
        <div className="grid grid-cols-3 gap-4 p-5 border border-gray-700 rounded-lg bg-gray-800">
          <div className="col-span-3 flex justify-between items-center mb-3">
            <h2 className="text-2xl text-gray-100">Generated Blob Tilesets</h2>
            <button
              onClick={downloadAllBlobTilesets}
              className="rounded-lg border border-transparent px-4 py-2 text-base font-medium bg-blue-600 text-gray-100 cursor-pointer transition-colors hover:bg-blue-500 hover:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
            >
              Download All as ZIP
            </button>
          </div>
          {blobTilesets.map((blobTileset, index) => (
            <div
              key={`${blobTileset.sourceX}-${blobTileset.sourceY}`}
              className="flex flex-col items-center gap-2"
            >
              <div className="text-sm text-gray-300">
                Source: ({blobTileset.sourceX}, {blobTileset.sourceY})
              </div>
              <canvas
                ref={(el) => (canvasRefs.current[index] = el)}
                className="border border-gray-600 bg-gray-900"
              />
              <button
                onClick={() => downloadBlobTileset(blobTileset, index)}
                className="rounded-lg border border-transparent px-4 py-2 text-sm font-medium bg-gray-700 text-gray-100 cursor-pointer transition-colors hover:bg-gray-600 hover:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
              >
                Download {getBlobName(blobTileset)}.webp
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
