import { useState, useEffect, useCallback } from "react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { Button } from "@/components/ui/Button";
import { useToastContext } from "../../hooks/useToast";
import { FileSystemDirectoryHandle } from "./types/file-system.types";

interface Props {
  images: string[];
  onImagesChanged?: (images: string[]) => void;
  sourceDirHandle?: FileSystemDirectoryHandle | null;
  visualIndexes?: number[];
  profiles?: (string | undefined)[];
}

// Suffix used in file names when the same car image exists in several versions
const PROFILE_FILE_LABELS: Record<string, string> = {
  download: "original",
};

export default function ProcessedImagesGallery({
  images,
  onImagesChanged,
  sourceDirHandle,
  visualIndexes,
  profiles,
}: Props) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [localImages, setLocalImages] = useState<string[]>(images);
  const { success, error } = useToastContext();

  useEffect(() => {
    setLocalImages(images);
  }, [images]);

  // Utility functions for file name and blob handling
  const getVisualIndex = useCallback(
    (index: number): number => {
      // If we have visualIndexes, use them to get visual order
      // Otherwise use index directly (fallback)
      if (visualIndexes && visualIndexes[index] !== undefined) {
        return visualIndexes[index];
      }
      return index;
    },
    [visualIndexes]
  );

  const generateFileName = useCallback(
    (index: number, extension: string = "png"): string => {
      const visualIndex = getVisualIndex(index);
      const baseName = `processed-car-${visualIndex + 1}`;

      // Several versions of the same car image (e.g. "All") need unique names
      const versions = localImages
        .map((_, i) => i)
        .filter((i) => getVisualIndex(i) === visualIndex);
      if (versions.length <= 1) {
        return `${baseName}.${extension}`;
      }

      const profile = profiles?.[index];
      const label = profile ? PROFILE_FILE_LABELS[profile] ?? profile : "version";
      const sameLabelBefore = versions.filter(
        (i) => i < index && profiles?.[i] === profile
      ).length;
      const counter = sameLabelBefore > 0 ? `-${sameLabelBefore + 1}` : "";
      return `${baseName}-${label}${counter}.${extension}`;
    },
    [getVisualIndex, localImages, profiles]
  );

  const fetchImageAsBlob = useCallback(async (url: string): Promise<Blob> => {
    const response = await fetch(url);
    return response.blob();
  }, []);

  const processAllImages = useCallback(
    async (
      processor: (blob: Blob, fileName: string, index: number) => Promise<void>
    ): Promise<void> => {
      if (localImages.length === 0) return;

      const fetchPromises = localImages.map(async (url, index) => {
        const blob = await fetchImageAsBlob(url);
        const fileName = generateFileName(index);
        await processor(blob, fileName, index);
      });

      await Promise.all(fetchPromises);
    },
    [localImages, fetchImageAsBlob, generateFileName]
  );

  // Download Single Image
  const downloadSingleImage = useCallback(
    (url: string, index: number) => {
      const link = document.createElement("a");
      link.href = url;
      link.download = generateFileName(index);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    [generateFileName]
  );

  // Download All Images as ZIP
  const downloadAllImagesAsZip = useCallback(async () => {
    setIsDownloading(true);

    try {
      const zip = new JSZip();

      await processAllImages(async (blob, fileName) => {
        zip.file(fileName, blob);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "processed-images.zip");
    } catch (error) {
      console.error("Error creating zip file:", error);
    } finally {
      setIsDownloading(false);
    }
  }, [processAllImages]);

  // Save to Source Folder
  const saveToSourceFolder = useCallback(async () => {
    if (!sourceDirHandle) {
      error("No source folder found. Please select a folder first.");
      return;
    }

    try {
      await processAllImages(async (blob, fileName) => {
        const fileHandle = await sourceDirHandle.getFileHandle(fileName, {
          create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
      });

      success("Images saved successfully to source folder!");
    } catch (err) {
      console.error("Error saving to source folder:", err);
      error("Failed to save images to source folder.");
    }
  }, [sourceDirHandle, processAllImages, success, error]);

  // Delete Image
  const deleteImage = useCallback(
    (index: number) => {
      const newImages = [...localImages];
      newImages.splice(index, 1);
      setLocalImages(newImages);

      if (onImagesChanged) {
        onImagesChanged(newImages);
      }
    },
    [localImages, onImagesChanged]
  );

  // Clear All Images
  const clearAllImages = useCallback(() => {
    setLocalImages([]);
    if (onImagesChanged) {
      onImagesChanged([]);
    }
  }, [onImagesChanged]);
  if (localImages.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-6xl">
        <div className="mt-15">
          <div className="mb-4 flex flex-col  gap-4">
            <h2 className="text-xl font-semibold text-white">
              Processed Images ({localImages.length})
            </h2>
            <div className="flex space-x-2">
              <Button
                onClick={downloadAllImagesAsZip}
                disabled={isDownloading}
                type="button"
                variant="secondary"
                size="default"
                className="w-full sm:w-auto">
                {isDownloading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating ZIP...
                  </>
                ) : (
                  <>
                    <span className="block sm:hidden">Download</span>
                    <span className="hidden sm:inline">Download as ZIP</span>
                  </>
                )}
              </Button>

              {sourceDirHandle && (
                <Button
                  onClick={saveToSourceFolder}
                  type="button"
                  variant="secondary"
                  size="default"
                  className="w-full sm:w-auto">
                  <span className="block sm:hidden">Save</span>
                  <span className="hidden sm:inline">
                    Save to Source Folder
                  </span>
                </Button>
              )}
              <Button
                onClick={clearAllImages}
                type="button"
                variant="destructive"
                size="default"
                className="w-full sm:w-auto">
                <span className="block sm:hidden">Clear</span>
                <span className="hidden sm:inline">Clear All Images</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {localImages.map((url, index) => (
              <div
                key={index}
                className="flex flex-col overflow-hidden rounded-md border border-gray-700 shadow-sm relative group">
                {/* Delete button overlay */}
                <button
                  onClick={() => deleteImage(index)}
                  className="cursor-pointer absolute top-2 right-2 bg-gray-900/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Remove image">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>

                <div className="aspect-square p-2 flex items-center justify-center bg-gray-600">
                  <img
                    src={url}
                    alt={`Processed image ${index + 1}`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="flex">
                  <button
                    onClick={() => downloadSingleImage(url, index)}
                    className="w-full cursor-pointer bg-gray-800 py-2 text-sm text-white hover:bg-gray-700">
                    Download
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
