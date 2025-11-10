import { useCallback, useRef, useState } from "react";

import { imageApi } from "../api/image.api";

interface ImageProcessingCallbacks {
  onStart?: () => void;
  onSuccess?: (
    data: { url: string; maskUrl?: string },
    fileIndex?: number
  ) => void;
  onError?: (message: string) => void;
  onProgress?: (current: number, total: number) => void;
}

export const useImageProcessing = (callbacks?: ImageProcessingCallbacks) => {
  const [isLoading, setIsLoading] = useState(false);
  const abortController = useRef<AbortController | null>(null);

  // Process an image using the Car Cutter API
  const processImage = useCallback(
    async (formData: FormData) => {
      setIsLoading(true);
      if (callbacks?.onStart) {
        callbacks.onStart();
      }

      try {
        // Create new controller for this request
        abortController.current = new AbortController();

        // Call the image processing API
        const data = await imageApi.processImage(formData);
        const imageUrl = URL.createObjectURL(data);

        setIsLoading(false);
        if (callbacks?.onSuccess) {
          callbacks.onSuccess({ url: imageUrl });
        }
      } catch (error) {
        console.error("Error processing image:", error);
        setIsLoading(false);

        // Don't show abort errors to the user
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        if (callbacks?.onError) {
          callbacks.onError(
            error instanceof Error ? error.message : "Failed to process image"
          );
        }
      }
    },
    [callbacks]
  );

  const cancelProcessing = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
      setIsLoading(false);
    }
  }, []);

  const downloadImage = useCallback(
    async (url: string, filename: string) => {
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error("Error downloading image:", error);
        if (callbacks?.onError) {
          callbacks.onError("Failed to download image");
        }
      }
    },
    [callbacks]
  );

  return {
    isLoading,
    processImage,
    cancelProcessing,
    downloadImage,
  };
};
