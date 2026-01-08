import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import "../../styles/uploader.css";
import UrlImageScraper from "./UrlImageScraper";
import {
  FileSystemDirectoryHandle,
  FileSystemFileHandle,
} from "./types/file-system.types";

interface Props {
  uploadId: string;
  multiple?: boolean;
  maxFileCount?: number;
  accept?: string;
  onImagesSelected?: (files: File[]) => void;
  onClear?: () => void;
  labelText?: string;
  onResetAll?: () => void;
  onSourceDirHandleChange?: (
    dirHandle: FileSystemDirectoryHandle | null
  ) => void;
}

export default function MultipleImageUploader({
  uploadId,
  multiple = true,
  maxFileCount = 0,
  accept = "*",
  onImagesSelected,
  onClear,
  onResetAll,
  onSourceDirHandleChange,
}: Props) {
  const [cachedFiles, setCachedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<"files" | "folder">("files");
  const [sourcePath, setSourcePath] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [sourceDirHandle, setSourceDirHandle] =
    useState<FileSystemDirectoryHandle | null>(null);
  const [isUrlScraperOpen, setIsUrlScraperOpen] = useState(false);

  // Reset all state
  const resetPreviewPanel = () => {
    setCachedFiles([]);
    setPreviewUrls([]);
    setSourcePath(null);
    setSourceDirHandle(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
    if (onImagesSelected) {
      onImagesSelected([]);
    }
    if (onClear) {
      onClear();
    }
    if (onResetAll) {
      onResetAll();
    }
    if (onSourceDirHandleChange) {
      onSourceDirHandleChange(null);
    }
  };

  // Generate preview URLs for files
  useEffect(() => {
    // Clean up old URLs
    previewUrls.forEach((url) => URL.revokeObjectURL(url));

    const newPreviewUrls = cachedFiles.map((file) => {
      if (
        file.type.match("image/png") ||
        file.type.match("image/jpeg") ||
        file.type.match("image/webp")
      ) {
        return URL.createObjectURL(file);
      }

      if (file.type.match("application/pdf")) {
        return "/icons/pdf-icon.png";
      } else if (file.type.match("video/*")) {
        return "/icons/video-icon.png";
      }

      // Default icon for other file types
      return "/icons/file-icon.png";
    });

    setPreviewUrls(newPreviewUrls);

    // Clean up when component unmounts or cachedFiles changes
    return () => {
      newPreviewUrls.forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cachedFiles]); // Only depend on cachedFiles

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesSelected(files);
    }
  };

  const handleFolderSelect = async () => {
    try {
      const dirHandle = await window.showDirectoryPicker({
        mode: "readwrite",
      });
      setSourcePath(dirHandle.name);
      setSourceDirHandle(dirHandle);

      // Notify parent component about source directory handle change
      if (onSourceDirHandleChange) {
        onSourceDirHandleChange(dirHandle);
      }

      const files: File[] = [];
      for await (const entry of dirHandle.values()) {
        if (
          entry.kind === "file" &&
          entry.name.match(/\.(jpg|jpeg|png|webp)$/i)
        ) {
          const fileHandle = entry as unknown as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          files.push(file);
        }
      }

      if (files.length > 0) {
        handleFilesSelected(files);
      }
    } catch (error) {
      console.error("Error selecting folder:", error);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    let fileArray = Array.from(files);

    // Filter only image files when selecting a folder
    if (uploadMode === "folder") {
      fileArray = fileArray.filter(
        (file) =>
          file.type.match("image/png") ||
          file.type.match("image/jpeg") ||
          file.type.match("image/webp")
      );
    }

    // Handle max file count for multiple uploads
    if (multiple && maxFileCount > 0) {
      const totalFileCount =
        (multiple ? cachedFiles.length : 0) + fileArray.length;
      if (totalFileCount > maxFileCount) {
        fileArray = fileArray.slice(
          0,
          fileArray.length - (totalFileCount - maxFileCount)
        );
      }
    }

    const newFiles = multiple ? [...cachedFiles, ...fileArray] : fileArray;

    setCachedFiles(newFiles);
    if (onImagesSelected) {
      onImagesSelected(newFiles);
    }
  };

  const handleUrlImagesLoaded = (files: File[]) => {
    setUploadMode("files");
    setSourcePath("URL Scraper");
    handleFilesSelected(files);
  };

  return (
    <div className="custom-file-container" data-upload-id={uploadId}>
      <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={() => {
              setUploadMode("files");
              if (fileInputRef.current) {
                fileInputRef.current.click();
              }
            }}
            className="w-full sm:w-auto">
            Select Files
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={handleFolderSelect}
            className="w-full sm:w-auto">
            Select Folder
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="default"
            onClick={() => setIsUrlScraperOpen(true)}
            className="w-full sm:w-auto">
            Select Image from URL
          </Button>
        </div>

        {sourcePath && (
          <div className="text-sm text-blue-400 mb-2">Source: {sourcePath}</div>
        )}

        <Button
          type="button"
          variant="destructive"
          size="default"
          onClick={resetPreviewPanel}
          disabled={cachedFiles.length === 0}
          className="w-full sm:w-auto"
          title={
            cachedFiles.length === 0
              ? "No images to clear"
              : "Clear all selected and processed images"
          }>
          Clear All Images
        </Button>
      </div>

      {/* Hidden file inputs - needed for button functionality */}
      <input
        ref={fileInputRef}
        accept={accept}
        className="hidden"
        id={`file-upload-with-preview-${uploadId}`}
        multiple={multiple}
        type="file"
        onChange={handleFileChange}
      />
      {/* Folder input - using webkitdirectory attribute */}
      <input
        ref={folderInputRef}
        accept={accept}
        className="hidden"
        id={`folder-upload-with-preview-${uploadId}`}
        type="file"
        // @ts-expect-error - webkitdirectory is a non-standard attribute not included in TypeScript's HTMLInputElement definition
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFileChange}
      />

      <div className="text-xs text-gray-400 mt-2">
        By uploading an image, you agree to our Terms of Service and Privacy
        Policy. Also see information on Licenses and third party components.
      </div>

      <UrlImageScraper
        isOpen={isUrlScraperOpen}
        onClose={() => setIsUrlScraperOpen(false)}
        onImagesLoaded={handleUrlImagesLoaded}
      />
    </div>
  );
}
