/**
 * File upload component for JSON files
 */

import { useCallback, useMemo } from "react";
import { FileDropZone } from "../ui/FileDropZone";
import { useJsonEditorStore } from "../../stores/json-editor.store";
import { CarJson, CarJsonSchema } from "../../types/json-editor.types";
import { useToastContext } from "../../hooks/useToast";

/**
 * Flatten nested Result structure to simple values
 * Converts { type: "ok", value: "BMW" } -> "BMW"
 * Handles nested objects like data.brand, price_b2b.value, etc.
 */
const flattenJson = (obj: unknown): Record<string, unknown> => {
  if (typeof obj !== "object" || obj === null) {
    return {};
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Handle Result structure: { type: "ok", value: ... } or { type: "err" }
    if (
      typeof value === "object" &&
      value !== null &&
      "type" in value
    ) {
      const resultObj = value as { type: string; value?: unknown };

      const resultValue = resultObj.value;

      // Always try to extract equipment list, even if type is "err"
      if (key === "equipment" && Array.isArray(resultValue)) {
        result[key] = resultValue
          .map((item) => {
            if (typeof item === "object" && item !== null && "type" in item) {
              const itemResult = item as { type: string; value?: unknown };
              if (itemResult.type === "ok" && "value" in itemResult) {
                return itemResult.value;
              }
              if (itemResult.type === "err") {
                if (
                  "value" in itemResult &&
                  itemResult.value !== undefined &&
                  itemResult.value !== null
                ) {
                  return String(itemResult.value);
                }
                return null;
              }
              return null;
            }
            if (typeof item === "string") {
              return item;
            }
            return null;
          })
          .filter((item): item is string => typeof item === "string");
        continue;
      }

      // Only extract other values if type is "ok"
      if (resultObj.type === "ok" && "value" in resultObj) {
        // Handle registration_date array: [year, month, day]
        if (key === "registration_date" && Array.isArray(resultValue)) {
          result[key] = resultValue;
        } else {
          result[key] = resultValue;
        }
      } else if (resultObj.type === "err") {
        // Keep fields visible even when value is missing
        result[key] = "";
      } else {
        continue;
      }
    }
    // Handle nested data object - flatten it recursively
    else if (key === "data" && typeof value === "object" && value !== null) {
      const flattenedData = flattenJson(value);
      // Merge data fields into root level
      Object.assign(result, flattenedData);
    }
    // Handle price objects: { value: 87904, currency: "CHF" }
    else if (
      (key === "price_b2b" || key === "price_b2c" || key === "comparison_price") &&
      typeof value === "object" &&
      value !== null &&
      "value" in value
    ) {
      // Keep price as object
      result[key] = value;
    }
    // Handle arrays (like images)
    else if (Array.isArray(value)) {
      result[key] = value;
    }
    // Handle other nested objects
    else if (typeof value === "object" && value !== null) {
      result[key] = value;
    }
    // Handle primitives
    else {
      result[key] = value;
    }
  }

  return result;
};

const getRelativePath = (file: File): string | undefined => {
  const fileWithPath = file as File & {
    __relativePath?: string;
    webkitRelativePath?: string;
  };
  return fileWithPath.__relativePath || fileWithPath.webkitRelativePath || undefined;
};

export function FileUpload() {
  const loadFile = useJsonEditorStore((state) => state.loadFile);
  const loadFiles = useJsonEditorStore((state) => state.loadFiles);
  const files = useJsonEditorStore((state) => state.files);
  const activeFileName = useJsonEditorStore((state) => state.activeFileName);
  const { success, error: errorToast } = useToastContext();
  
  // Memoize file list to prevent infinite loops
  const fileList = useMemo(() => {
    const list: Array<{ fileName: string; isSaved: boolean; isActive: boolean }> = [];
    files.forEach((fileData, fileName) => {
      list.push({
        fileName,
        isSaved: fileData.isSaved,
        isActive: activeFileName === fileName,
      });
    });
    return list.sort((a, b) => a.fileName.localeCompare(b.fileName));
  }, [files, activeFileName]);

  const processJsonFile = useCallback(
    async (file: File): Promise<{ name: string; json: CarJson } | null> => {
      try {
        const text = await file.text();
        const json = JSON.parse(text) as unknown;

        // Flatten nested Result structure to simple values
        const flattened = flattenJson(json);
        
        // Ensure equipment is always an array
        if (!Array.isArray(flattened.equipment)) {
          flattened.equipment = [];
        }
        
        // Validate schema (passthrough allows extra fields)
        const parseResult = CarJsonSchema.safeParse(flattened);
        if (!parseResult.success) {
          console.error("Schema validation error:", parseResult.error);
          // Still try to load the file even if schema validation fails
          // since we're using passthrough
        }

        // Use flattened data directly (schema validation is lenient with passthrough)
        const carJson = (parseResult.success ? parseResult.data : flattened) as CarJson;
        return { name: file.name, json: carJson };
      } catch (error) {
        console.error(`Failed to load ${file.name}:`, error);
        return null;
      }
    },
    []
  );


  const handleFilesSelected = useCallback(
    async (files: File[]) => {
      const jsonFiles = files.filter((file) => file.name.endsWith(".json"));
      if (jsonFiles.length === 0) return;

      // Process all files in parallel
      const filePromises = jsonFiles.map(processJsonFile);
      const results = await Promise.all(filePromises);
      
      // Extract relative paths from File objects if available (from folder selection)
      const validFiles = results.flatMap((result, index) => {
        if (!result) return [];
        const file = jsonFiles[index];
        // File objects from folder selection via showDirectoryPicker have __relativePath property
        // File objects from folder input have webkitRelativePath property (read-only)
        const relativePath = getRelativePath(file);
        return [{ ...result, relativePath }];
      });

      if (validFiles.length > 0) {
        if (validFiles.length === 1) {
          loadFile(validFiles[0].json, validFiles[0].name);
        } else {
          loadFiles(validFiles);
        }
      }
    },
    [processJsonFile, loadFile, loadFiles]
  );

  const handleFolderSelected = useCallback(
    async (files: File[]) => {
      await handleFilesSelected(files);
    },
    [handleFilesSelected]
  );

  const handleFilesLoaded = useCallback(
    (fileCount: number) => {
      success(
        `${fileCount} file${fileCount > 1 ? "s" : ""} loaded successfully`
      );
    },
    [success]
  );

  const handleFolderLoaded = useCallback(
    (fileCount: number) => {
      success(
        `Folder loaded: ${fileCount} file${fileCount > 1 ? "s" : ""} found`
      );
    },
    [success]
  );

  const handleError = useCallback(
    (error: string) => {
      errorToast(error);
    },
    [errorToast]
  );

  // Hide FileDropZone when files are loaded
  if (fileList.length > 0) {
    return null;
  }

  return (
    <FileDropZone
      onFilesSelected={handleFilesSelected}
      onFolderSelected={handleFolderSelected}
      onFilesLoaded={handleFilesLoaded}
      onFolderLoaded={handleFolderLoaded}
      onError={handleError}
      accept=".json"
      multiple={true}
      isLoading={false}
      title="Drag and drop JSON files here, or click to select"
      description="Supports single or multiple JSON files"
      buttonText="Choose Files"
      showFolderOption={true}
    />
  );
}
