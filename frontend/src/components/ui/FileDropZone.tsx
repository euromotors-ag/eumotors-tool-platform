/**
 * Reusable File Drop Zone Component
 * Used in both PDF Converter and JSON Editor
 * Supports drag & drop for files and folders
 */

import { useRef, useState, useCallback, ReactNode } from "react";
import { Upload } from "lucide-react";
import { Button } from "./Button";

export interface FileDropZoneProps {
  /** Callback when files are selected/dropped */
  onFilesSelected: (files: File[]) => void | Promise<void>;
  /** Callback when folder is selected (via right-click or button) */
  onFolderSelected?: (files: File[]) => void | Promise<void>;
  /** Optional callback when files are successfully loaded (for toast notifications) */
  onFilesLoaded?: (fileCount: number) => void;
  /** Optional callback when folder is successfully loaded (for toast notifications) */
  onFolderLoaded?: (fileCount: number) => void;
  /** Optional callback when an error occurs */
  onError?: (error: string) => void;
  /** Accepted file types (e.g., ".json", ".pdf") */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Custom title text */
  title?: string;
  /** Custom description text */
  description?: string;
  /** Button text */
  buttonText?: string;
  /** Show folder selection option */
  showFolderOption?: boolean;
  /** Display file count when files are loaded */
  fileCount?: number;
  /** Custom content to show when files are loaded */
  loadedContent?: ReactNode;
}

export function FileDropZone({
  onFilesSelected,
  onFolderSelected,
  onFilesLoaded,
  onFolderLoaded,
  onError,
  accept = "*",
  multiple = true,
  isLoading = false,
  title = "Drag and drop files here, or click to select",
  description,
  buttonText = "Choose Files",
  showFolderOption = true,
  fileCount,
  loadedContent,
}: FileDropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      // Check if folder was dropped (DataTransferItem with kind === "directory")
      // This works when dragging folders from file explorer
      if (
        onFolderSelected &&
        e.dataTransfer.items &&
        e.dataTransfer.items.length > 0
      ) {
        const items = Array.from(e.dataTransfer.items);

        // Try to find a directory item
        for (const item of items) {
          // Skip if it's not a file/directory item
          if (item.kind !== "file") continue;

          try {
            // Method 1: Try getAsFileSystemHandle (modern API, Chrome 86+, Edge 86+)
            if (
              "getAsFileSystemHandle" in item &&
              typeof (item as any).getAsFileSystemHandle === "function"
            ) {
              try {
                const handle = await (item as any).getAsFileSystemHandle();
                if (handle && handle.kind === "directory") {
                  const files: File[] = [];
                  for await (const entry of handle.values()) {
                    if (entry.kind === "file") {
                      const file = await (entry as any).getFile();
                      // Filter by accept pattern if specified
                      const acceptPattern =
                        accept === "*"
                          ? null
                          : new RegExp(
                              accept
                                .split(",")
                                .map((a) => a.trim().replace(/\./g, "\\."))
                                .join("|"),
                              "i"
                            );
                      if (!acceptPattern || file.name.match(acceptPattern)) {
                        files.push(file);
                      }
                    }
                  }
                  if (files.length > 0) {
                    await onFolderSelected(files);
                    return;
                  }
                }
              } catch (err) {
                // getAsFileSystemHandle might fail, try next method
                console.debug(
                  "getAsFileSystemHandle failed, trying webkitGetAsEntry:",
                  err
                );
              }
            }

            // Method 2: Try webkitGetAsEntry (Chrome/Edge fallback, legacy API)
            if (
              "webkitGetAsEntry" in item &&
              typeof (item as any).webkitGetAsEntry === "function"
            ) {
              const entry = (item as any).webkitGetAsEntry();
              if (entry && entry.isDirectory) {
                // webkitGetAsEntry uses callbacks, so we need to wrap it in a Promise
                const files: File[] = [];

                function readDirectory(entry: any): Promise<void> {
                  return new Promise((resolve) => {
                    if (entry.isFile) {
                      entry.file((file: File) => {
                        const acceptPattern =
                          accept === "*"
                            ? null
                            : new RegExp(
                                accept
                                  .split(",")
                                  .map((a) => a.trim().replace(/\./g, "\\."))
                                  .join("|"),
                                "i"
                              );
                        if (!acceptPattern || file.name.match(acceptPattern)) {
                          files.push(file);
                        }
                        resolve();
                      });
                    } else if (entry.isDirectory) {
                      const reader = entry.createReader();
                      const readEntries = (): Promise<void> => {
                        return new Promise((resolveEntries) => {
                          reader.readEntries(async (entries: any[]) => {
                            if (entries.length === 0) {
                              resolveEntries();
                              return;
                            }
                            for (const subEntry of entries) {
                              await readDirectory(subEntry);
                            }
                            // Read more entries if there are any (readEntries returns chunks)
                            await readEntries();
                            resolveEntries();
                          });
                        });
                      };
                      readEntries().then(() => resolve());
                    } else {
                      resolve();
                    }
                  });
                }

                await readDirectory(entry);
                if (files.length > 0) {
                  await onFolderSelected(files);
                  return;
                }
              }
            }
          } catch (error) {
            console.error("Failed to read dropped folder:", error);
            // Continue to next item or fall through to file handling
          }
        }
      }

      // Handle regular file drop
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await onFilesSelected(files);
      }
    },
    [onFilesSelected, onFolderSelected, accept]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      try {
        await onFilesSelected(Array.from(files));
        onFilesLoaded?.(files.length);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load files";
        onError?.(errorMessage);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onFilesSelected, onFilesLoaded, onError]
  );

  const handleFolderSelect = useCallback(async () => {
    if (!onFolderSelected || !("showDirectoryPicker" in window)) {
      return;
    }

    try {
      const directoryHandle = await (window as any).showDirectoryPicker();
      const files: File[] = [];

      // Recursively traverse directory structure and preserve relative paths
      const acceptPattern =
        accept === "*"
          ? null
          : new RegExp(
              accept
                .split(",")
                .map((a) => a.trim().replace(/\./g, "\\."))
                .join("|"),
              "i"
            );

      const traverseDirectory = async (
        dirHandle: any,
        relativePath: string = ""
      ): Promise<void> => {
        for await (const entry of dirHandle.values()) {
          const entryPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

          if (entry.kind === "file") {
            const file = await entry.getFile();
            if (!acceptPattern || file.name.match(acceptPattern)) {
              // Store relative path as custom property (webkitRelativePath is read-only)
              // Use a different property name that we control
              (file as any).__relativePath = entryPath;
              files.push(file);
            }
          } else if (entry.kind === "directory") {
            // Recursively traverse subdirectories
            await traverseDirectory(entry, entryPath);
          }
        }
      };

      await traverseDirectory(directoryHandle);

      if (files.length > 0) {
        try {
          await onFolderSelected(files);
          onFolderLoaded?.(files.length);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to load folder";
          onError?.(errorMessage);
        }
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to read folder";
        onError?.(errorMessage);
        console.error("Failed to read folder:", error);
      }
    }
  }, [onFolderSelected, onFolderLoaded, onError, accept]);

  const handleFileButtonClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  }, []);

  const handleFolderButtonClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      handleFolderSelect();
    },
    [handleFolderSelect]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (showFolderOption && onFolderSelected) {
        e.preventDefault();
        handleFolderSelect();
      }
    },
    [showFolderOption, onFolderSelected, handleFolderSelect]
  );

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
      className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary bg-muted/30"
      }`}>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileInput}
        className="hidden"
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-lg font-semibold">Loading...</p>
        </div>
      ) : fileCount !== undefined && fileCount > 0 && loadedContent ? (
        loadedContent
      ) : (
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Upload className="size-10 text-primary" />
          </div>
          <div>
            <p className="text-lg font-semibold mb-2">{title}</p>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
            {showFolderOption &&
              onFolderSelected &&
              "showDirectoryPicker" in window && (
                <p className="text-xs text-muted-foreground mt-2">
                  Right-click to select folder
                </p>
              )}
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleFileButtonClick}>
              {buttonText}
            </Button>
            {showFolderOption &&
              onFolderSelected &&
              "showDirectoryPicker" in window && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFolderButtonClick}>
                  Choose Folder
                </Button>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
