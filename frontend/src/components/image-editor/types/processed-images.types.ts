// Types for ProcessedImagesGallery component
export interface ProcessedImagesGalleryProps {
  images: string[];
  onImagesChanged?: (images: string[]) => void;
  sourcePath?: string | null;
  originalIndexes?: number[];
}

// Types for image processing functions
export interface ImageProcessor {
  (blob: Blob, fileName: string, index: number): Promise<void>;
}

// Types for download operations
export interface DownloadOptions {
  extension?: string;
  prefix?: string;
}

// Types for file operations
export interface FileOperationResult {
  success: boolean;
  fileName: string;
  error?: string;
}
