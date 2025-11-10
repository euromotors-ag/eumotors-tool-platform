import { useRef, useState, useCallback } from "react";
import { useImageProcessing } from "./useImageProcessing";

export function useBatchProcessing(onImageProcessed?: (url: string) => void) {
  const [isProcessing, setIsProcessing] = useState(false);
  const batchProcessingRef = useRef(false);

  const { isLoading, processImage, cancelProcessing } = useImageProcessing({
    onStart: () => {
      setIsProcessing(true);
    },
    onSuccess: (data) => {
      setIsProcessing(false);
      if (onImageProcessed) {
        onImageProcessed(data.url);
      }
    },
    onError: (message) => {
      console.error("Error:", message);
      setIsProcessing(false);
      batchProcessingRef.current = false;
    },
  });

  const processSelectedImages = useCallback(
    async (
      files: File[],
      selectedImages: Set<number>,
      profileKey: string,
      onProgress?: (index: number) => void
    ) => {
      // Handle download profile - just create object URLs and return them
      if (profileKey === "download") {
        // If no images are explicitly selected but there's a current file
        if (selectedImages.size === 0 && files.length > 0) {
          const currentFile = files[0]; // Default to first file
          const blobUrl = URL.createObjectURL(currentFile);

          if (onImageProcessed) {
            onImageProcessed(blobUrl);
          }
          return;
        }

        // Process selected images
        if (selectedImages.size === 0) return;

        setIsProcessing(true);
        batchProcessingRef.current = true;

        try {
          // Convert Set to sorted array for predictable processing order
          const indexesToProcess = [...selectedImages].sort((a, b) => a - b);

          // Process images one by one
          for (let i = 0; i < indexesToProcess.length; i++) {
            // Check if processing has been cancelled
            if (!batchProcessingRef.current) {
              console.log("Batch processing cancelled");
              break;
            }

            const fileIndex = indexesToProcess[i];
            const file = files[fileIndex];

            if (!file) continue;

            // Update UI to show which image is being processed
            if (onProgress) {
              onProgress(fileIndex);
            }

            // Create object URL for the original image
            const blobUrl = URL.createObjectURL(file);

            if (onImageProcessed) {
              onImageProcessed(blobUrl);
            }

            // Short pause between processing
            if (i < indexesToProcess.length - 1 && batchProcessingRef.current) {
              await new Promise((resolve) => setTimeout(resolve, 300));
            }
          }
        } catch (error) {
          console.error("Error in batch processing:", error);
        } finally {
          setIsProcessing(false);
          batchProcessingRef.current = false;
        }
        return;
      }

      // Handle the "all" profile case
      if (profileKey === "all") {
        if (selectedImages.size === 0 && files.length > 0) {
          const currentFile = files[0];

          // Process with eumotors profile
          const euFormData = new FormData();
          euFormData.append("image", currentFile);
          euFormData.append("profile_key", "eumotors");
          await processImage(euFormData);

          // Process with cartrade24 profile
          const ctFormData = new FormData();
          ctFormData.append("image", currentFile);
          ctFormData.append("profile_key", "cartrade24");
          await processImage(ctFormData);

          return;
        }

        // Process selected images with both profiles
        if (selectedImages.size > 0) {
          setIsProcessing(true);
          batchProcessingRef.current = true;

          try {
            // Convert Set to sorted array
            const indexesToProcess = [...selectedImages].sort((a, b) => a - b);

            for (let i = 0; i < indexesToProcess.length; i++) {
              if (!batchProcessingRef.current) break;

              const fileIndex = indexesToProcess[i];
              const file = files[fileIndex];

              if (!file) continue;

              if (onProgress) {
                onProgress(fileIndex);
              }

              // Process with eumotors profile
              const euFormData = new FormData();
              euFormData.append("image", file);
              euFormData.append("profile_key", "eumotors");
              await processImage(euFormData);

              // Process with cartrade24 profile
              const ctFormData = new FormData();
              ctFormData.append("image", file);
              ctFormData.append("profile_key", "cartrade24");
              await processImage(ctFormData);

              // Short pause
              if (
                i < indexesToProcess.length - 1 &&
                batchProcessingRef.current
              ) {
                await new Promise((resolve) => setTimeout(resolve, 500));
              }
            }
          } catch (error) {
            console.error("Error processing with both profiles:", error);
          } finally {
            setIsProcessing(false);
            batchProcessingRef.current = false;
          }
          return;
        }
      }

      // Regular processing for single profile
      // If no images are explicitly selected but there's a current file
      if (selectedImages.size === 0 && files.length > 0) {
        const currentFile = files[0]; // Default to first file
        const formData = new FormData();
        formData.append("image", currentFile);
        formData.append("profile_key", profileKey);
        await processImage(formData);
        return;
      }

      // Otherwise process all selected images
      if (selectedImages.size === 0) return;

      setIsProcessing(true);
      batchProcessingRef.current = true;

      try {
        // Convert Set to sorted array for predictable processing order
        const indexesToProcess = [...selectedImages].sort((a, b) => a - b);

        // Process images one by one
        for (let i = 0; i < indexesToProcess.length; i++) {
          // Check if processing has been cancelled
          if (!batchProcessingRef.current) {
            console.log("Batch processing cancelled");
            break;
          }

          const fileIndex = indexesToProcess[i];
          const file = files[fileIndex];

          if (!file) continue;

          // Update UI to show which image is being processed
          if (onProgress) {
            onProgress(fileIndex);
          }

          // Process the current image
          const formData = new FormData();
          formData.append("image", file);
          formData.append("profile_key", profileKey);

          await processImage(formData);

          // Short pause between requests
          if (i < indexesToProcess.length - 1 && batchProcessingRef.current) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      } catch (error) {
        console.error("Error in batch processing:", error);
      } finally {
        setIsProcessing(false);
        batchProcessingRef.current = false;
      }
    },
    [processImage, cancelProcessing]
  );

  const handleCancel = useCallback(() => {
    cancelProcessing();
    batchProcessingRef.current = false;
    setIsProcessing(false);
  }, [cancelProcessing]);

  return {
    isLoading,
    isProcessing,
    processSelectedImages,
    handleCancel,
  };
}
