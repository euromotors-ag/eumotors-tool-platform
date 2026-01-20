import { useState, useCallback, useEffect } from "react";
import {
  FileIcon,
  DownloadIcon,
  XIcon,
  FileTextIcon,
  FileJsonIcon,
  CopyIcon,
  SettingsIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FileDropZone } from "@/components/ui/FileDropZone";
import { useToastContext } from "@/hooks/useToast";
import {
  extractTextFromPdf,
  convertToJson,
  type ExtractedTextData,
} from "@/utils/pdfExtractor";
import {
  mapPdfToListingJson,
  debugPatternMatching,
  type JsonTemplate,
  type MappingRule,
  createListingTemplate,
  createListingMappingRules,
} from "@/utils/pdfMapper";
// Dynamic imports for code splitting - these libraries are only needed when exporting
// This reduces initial bundle size by ~150KB

interface UploadedFile {
  id: string;
  file: File;
  preview?: string;
  isPdf?: boolean;
  extractedData?: ExtractedTextData;
  jsonOutput?: string;
  mappedJson?: string;
}

function PdfConverter() {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [extractingPdf, setExtractingPdf] = useState<string | null>(null);
  const [jsonTemplate, setJsonTemplate] = useState<JsonTemplate>(
    createListingTemplate()
  );
  const [mappingRules, setMappingRules] = useState<MappingRule[]>(
    createListingMappingRules()
  );
  const [showMappingSettings, setShowMappingSettings] = useState(false);
  const { success, error: errorToast } = useToastContext();

  const extractPdfText = useCallback(
    async (fileId: string, file: File) => {
      setExtractingPdf(fileId);
      try {
        const extractedData = await extractTextFromPdf(file);
        const jsonOutput = convertToJson(extractedData);

        // Map PDF text to JSON template
        const mappedData = mapPdfToListingJson(
          extractedData,
          jsonTemplate,
          mappingRules
        );
        const mappedJson = JSON.stringify(mappedData, null, 2);

        // Debug: Get pattern matching results (hidden in UI but logged to console)
        const debugInfo = debugPatternMatching(
          extractedData.fullText,
          mappingRules
        );
        console.log("Pattern Matching Debug:", debugInfo);
        console.log("Using mapping rules:", mappingRules.length, "rules");
        console.log(
          "Rules keys:",
          mappingRules.map((r) => r.key)
        );

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, extractedData, jsonOutput, mappedJson }
              : f
          )
        );

        // Store debug results for this specific file
        // We'll show debug info for the currently extracted file

        success(`Text extracted from ${file.name}`);
      } catch (error) {
        errorToast(
          error instanceof Error
            ? `Failed to extract text: ${error.message}`
            : "Failed to extract text from PDF"
        );
      } finally {
        setExtractingPdf(null);
      }
    },
    [success, errorToast, jsonTemplate, mappingRules]
  );

  const processFiles = useCallback(
    async (files: File[]) => {
      const pdfFiles = Array.from(files).filter(
        (file) =>
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf")
      );

      const rejectedCount = files.length - pdfFiles.length;
      if (rejectedCount > 0) {
        errorToast("Only PDF files are supported in the PDF Converter.");
      }

      if (pdfFiles.length === 0) {
        return;
      }

      const newFiles: UploadedFile[] = pdfFiles.map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file,
        isPdf: true,
      }));

      setUploadedFiles((prev) => [...prev, ...newFiles]);
      // Toast will be shown by FileDropZone's onFilesLoaded/onFolderLoaded callbacks

      // Automatically extract text from PDF files
      for (const newFile of newFiles) {
        await extractPdfText(newFile.id, newFile.file);
      }
    },
    [extractPdfText, errorToast]
  );

  const handleRemoveFile = useCallback(
    (id: string) => {
      setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
      success("File has been removed from the list");
    },
    [success]
  );

  const handleClearAll = useCallback(() => {
    setUploadedFiles([]);
    success("All files have been removed");
  }, [success]);

  const handleDownloadJson = useCallback(
    async (
      _fileId: string,
      fileName: string,
      jsonOutput: string,
      outputType: "mapped" | "raw"
    ) => {
      // Dynamic import for code splitting
      const { saveAs } = await import("file-saver");
      const blob = new Blob([jsonOutput], { type: "application/json" });
      const baseFileName = fileName.replace(/\.pdf$/i, "");
      const outputFileName =
        outputType === "mapped"
          ? `${baseFileName}.json`
          : `${baseFileName}-raw.json`;
      saveAs(blob, outputFileName);
      success("JSON file downloaded successfully");
    },
    [success]
  );

  const handleCopyJson = useCallback(
    async (jsonOutput: string) => {
      try {
        await navigator.clipboard.writeText(jsonOutput);
        success("JSON copied to clipboard");
      } catch {
        errorToast("Failed to copy JSON to clipboard");
      }
    },
    [success, errorToast]
  );

  const handleDownloadAllMappedJson = useCallback(async () => {
    const pdfFiles = uploadedFiles.filter((f) => f.isPdf && f.mappedJson);

    if (pdfFiles.length === 0) {
      errorToast("No mapped JSON files available to download");
      return;
    }

    try {
      // Dynamic import for code splitting - only load when exporting
      const JSZip = (await import("jszip")).default;
      const { saveAs } = await import("file-saver");
      
      const zip = new JSZip();

      pdfFiles.forEach((file) => {
        const baseFileName = file.file.name.replace(/\.pdf$/i, "");
        zip.file(`${baseFileName}.json`, file.mappedJson!);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "all_mapped_json_files.zip");
      success(`Downloaded ${pdfFiles.length} mapped JSON file(s)`);
    } catch (error) {
      errorToast("Failed to create ZIP file");
      console.error(error);
    }
  }, [uploadedFiles, success, errorToast]);

  const handleDownloadAllRawJson = useCallback(async () => {
    const pdfFiles = uploadedFiles.filter((f) => f.isPdf && f.jsonOutput);

    if (pdfFiles.length === 0) {
      errorToast("No raw JSON files available to download");
      return;
    }

    try {
      // Dynamic import for code splitting - only load when exporting
      const JSZip = (await import("jszip")).default;
      const { saveAs } = await import("file-saver");
      
      const zip = new JSZip();

      pdfFiles.forEach((file) => {
        const baseFileName = file.file.name.replace(/\.pdf$/i, "");
        zip.file(`${baseFileName}-raw.json`, file.jsonOutput!);
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "all_raw_json_files.zip");
      success(`Downloaded ${pdfFiles.length} raw JSON file(s)`);
    } catch (error) {
      errorToast("Failed to create ZIP file");
      console.error(error);
    }
  }, [uploadedFiles, success, errorToast]);

  const handleDownloadAll = useCallback(async () => {
    const pdfFiles = uploadedFiles.filter(
      (f) => f.isPdf && (f.mappedJson || f.jsonOutput)
    );

    if (pdfFiles.length === 0) {
      errorToast("No JSON files available to download");
      return;
    }

    try {
      // Dynamic import for code splitting - only load when exporting
      const JSZip = (await import("jszip")).default;
      const { saveAs } = await import("file-saver");
      
      const zip = new JSZip();

      pdfFiles.forEach((file) => {
        const baseFileName = file.file.name.replace(/\.pdf$/i, "");
        if (file.mappedJson) {
          zip.file(`${baseFileName}.json`, file.mappedJson);
        }
        if (file.jsonOutput) {
          zip.file(`${baseFileName}-raw.json`, file.jsonOutput);
        }
      });

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, "all_json_files.zip");
      success(`Downloaded ${pdfFiles.length} PDF file(s) as JSON`);
    } catch (error) {
      errorToast("Failed to create ZIP file");
      console.error(error);
    }
  }, [uploadedFiles, success, errorToast]);

  const handleLoadTemplate = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          setJsonTemplate(parsed);
          success("JSON template loaded successfully");
        } catch {
          errorToast("Failed to parse JSON template file");
        }
      };
      reader.readAsText(file);
    },
    [success, errorToast]
  );

  const handleLoadMappingRules = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content) as MappingRule[];
          setMappingRules(parsed);
          success("Mapping rules loaded successfully");

          // Re-map all existing PDFs with new rules
          setUploadedFiles((prev) =>
            prev.map((uploadedFile) => {
              if (uploadedFile.isPdf && uploadedFile.extractedData) {
                const mappedData = mapPdfToListingJson(
                  uploadedFile.extractedData,
                  jsonTemplate,
                  parsed
                );
                const mappedJson = JSON.stringify(mappedData, null, 2);
                // Debug info is logged to console but not displayed in UI
                const debugInfo = debugPatternMatching(
                  uploadedFile.extractedData.fullText,
                  parsed
                );
                console.log(
                  "Pattern Matching Debug (after rules update):",
                  debugInfo
                );

                return { ...uploadedFile, mappedJson };
              }
              return uploadedFile;
            })
          );
        } catch {
          errorToast("Failed to parse mapping rules file");
        }
      };
      reader.readAsText(file);
    },
    [success, errorToast, jsonTemplate]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  // Cleanup preview URLs when component unmounts or files change
  useEffect(() => {
    return () => {
      uploadedFiles.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [uploadedFiles]);

  return (
    <div className="space-y-6">
      {/* Mapping Settings */}
      <div className="p-4 bg-card border border-border rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <SettingsIcon className="size-5 text-primary" />
            <h3 className="font-semibold">JSON Mapping Configuration</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowMappingSettings(!showMappingSettings)}>
            {showMappingSettings ? "Hide" : "Show"} Settings
          </Button>
        </div>

        {showMappingSettings && (
          <div className="space-y-4 pt-4 border-t border-border">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Load JSON Template
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleLoadTemplate}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload a JSON file with your desired structure
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Load Mapping Rules
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleLoadMappingRules}
                  className="text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload mapping rules (patterns to extract values)
                </p>
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded border border-border">
              <p className="text-xs font-medium mb-2">Current Template:</p>
              <pre className="text-xs overflow-x-auto">
                <code>{JSON.stringify(jsonTemplate, null, 2)}</code>
              </pre>
            </div>

            <div className="p-3 bg-muted/50 rounded border border-border">
              <p className="text-xs font-medium mb-2">
                Current Mapping Rules ({mappingRules.length} rules):
              </p>
              <div className="text-xs text-muted-foreground mb-2">
                {mappingRules.length > 0 && (
                  <span>Keys: {mappingRules.map((r) => r.key).join(", ")}</span>
                )}
              </div>
              <pre className="text-xs overflow-x-auto max-h-32 overflow-y-auto">
                <code>{JSON.stringify(mappingRules, null, 2)}</code>
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Upload Area */}
      <FileDropZone
        onFilesSelected={processFiles}
        onFolderSelected={processFiles}
        onFilesLoaded={(count) => success(`${count} file(s) added successfully`)}
        onFolderLoaded={(count) =>
          success(`Folder loaded: ${count} file(s) found`)}
        onError={(error) => errorToast(error)}
        accept=".pdf"
        multiple={true}
        isLoading={false}
        title="Drag and drop files here, or click to select"
        description="Only PDF files are supported"
        buttonText="Choose Files"
        showFolderOption={true}
      />

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-semibold">
              Selected Files ({uploadedFiles.length})
            </h3>
            <div className="flex items-center gap-2 flex-wrap">
              {uploadedFiles.some((f) => f.isPdf && f.mappedJson) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAllMappedJson}
                  className="gap-2">
                  <DownloadIcon className="size-4" />
                  Download All Mapped JSON
                </Button>
              )}
              {uploadedFiles.some((f) => f.isPdf && f.jsonOutput) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAllRawJson}
                  className="gap-2">
                  <DownloadIcon className="size-4" />
                  Download All Raw JSON
                </Button>
              )}
              {uploadedFiles.some(
                (f) => f.isPdf && (f.mappedJson || f.jsonOutput)
              ) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadAll}
                  className="gap-2">
                  <DownloadIcon className="size-4" />
                  Download All
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleClearAll}>
                Clear All
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {uploadedFiles.map((uploadedFile) => (
              <div key={uploadedFile.id} className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-muted/50 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="shrink-0">
                    <div className="rounded-lg bg-background p-2 border border-border">
                      {uploadedFile.isPdf ? (
                        <FileTextIcon className="size-5 text-red-500" />
                      ) : uploadedFile.preview ? (
                        <img
                          src={uploadedFile.preview}
                          alt={uploadedFile.file.name}
                          className="size-5 object-cover rounded"
                        />
                      ) : (
                        <FileIcon className="size-5 text-primary" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-foreground">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)} •{" "}
                      {uploadedFile.file.type || "Unknown type"}
                      {uploadedFile.isPdf && " • PDF"}
                      {extractingPdf === uploadedFile.id &&
                        " • Extracting text..."}
                      {uploadedFile.extractedData && " • Text extracted"}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(uploadedFile.id)}
                    disabled={extractingPdf === uploadedFile.id}
                    className="shrink-0 hover:bg-destructive/10 hover:text-destructive">
                    <XIcon className="size-4" />
                  </Button>
                </div>

                {/* JSON Output for PDF files */}
                {uploadedFile.isPdf && uploadedFile.jsonOutput && (
                  <div className="ml-4 space-y-3">
                    {/* Debug Info - Hidden for now */}
                    {/* {debugResults.length > 0 && (
                      <div className="p-4 bg-card border border-yellow-500/50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-sm flex items-center gap-2">
                            <span>🔍 Pattern Matching Debug</span>
                          </h4>
                          <span className="text-xs text-muted-foreground">
                            {debugResults.filter((r) => r.matched).length} /{" "}
                            {debugResults.length} matched
                          </span>
                        </div>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {debugResults.map((result, idx) => (
                            <div
                              key={idx}
                              className={`text-xs p-2 rounded border ${
                                result.matched
                                  ? "bg-green-500/10 border-green-500/30"
                                  : "bg-red-500/10 border-red-500/30"
                              }`}>
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-medium">
                                  {result.key}:
                                </span>
                                <span
                                  className={
                                    result.matched
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }>
                                  {result.matched ? "✓ Matched" : "✗ No match"}
                                </span>
                              </div>
                              {result.matched && result.value && (
                                <div className="mt-1 text-muted-foreground">
                                  Value:{" "}
                                  <span className="font-mono">
                                    {result.value}
                                  </span>
                                </div>
                              )}
                              {!result.matched && (
                                <div className="mt-1 text-xs text-muted-foreground font-mono break-all">
                                  Pattern: {result.pattern}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )} */}

                    {/* Mapped JSON (Standardized Structure) */}
                    {uploadedFile.mappedJson && (
                      <div className="p-4 bg-card border border-green-500/50 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileJsonIcon className="size-4 text-green-500" />
                            <h4 className="font-semibold text-sm">
                              Mapped JSON (Vehicle Data)
                            </h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleCopyJson(uploadedFile.mappedJson!)
                              }
                              className="h-8">
                              <CopyIcon className="size-3 mr-2" />
                              Copy
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDownloadJson(
                                  uploadedFile.id,
                                  uploadedFile.file.name,
                                  uploadedFile.mappedJson!,
                                  "mapped"
                                )
                              }
                              className="h-8">
                              <DownloadIcon className="size-3 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>
                        <pre className="text-xs bg-muted/50 p-3 rounded border border-border overflow-x-auto max-h-64 overflow-y-auto">
                          <code>{uploadedFile.mappedJson}</code>
                        </pre>
                      </div>
                    )}

                    {/* Raw Extracted JSON */}
                    <div className="p-4 bg-card border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileJsonIcon className="size-4 text-orange-500" />
                          <h4 className="font-semibold text-sm">
                            Raw Extracted JSON
                          </h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleCopyJson(uploadedFile.jsonOutput!)
                            }
                            className="h-8">
                            <CopyIcon className="size-3 mr-2" />
                            Copy
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDownloadJson(
                                uploadedFile.id,
                                uploadedFile.file.name,
                                  uploadedFile.jsonOutput!,
                                  "raw"
                              )
                            }
                            className="h-8">
                            <DownloadIcon className="size-3 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                      {uploadedFile.extractedData && (
                        <div className="mb-3 text-xs text-muted-foreground">
                          <span className="font-medium">Pages:</span>{" "}
                          {uploadedFile.extractedData.totalPages} •{" "}
                          <span className="font-medium">Words:</span>{" "}
                          {uploadedFile.extractedData.totalWordCount}
                        </div>
                      )}
                      <pre className="text-xs bg-muted/50 p-3 rounded border border-border overflow-x-auto max-h-64 overflow-y-auto">
                        <code>{uploadedFile.jsonOutput}</code>
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 p-6 bg-muted/50 rounded-lg border border-border">
        <h4 className="font-semibold mb-2">About PDF Text Extraction</h4>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li>Automatically extracts text from PDF documents when uploaded</li>
          <li>Converts extracted text to structured JSON format</li>
          <li>Includes page-by-page text extraction with word counts</li>
          <li>Extracts PDF metadata (title, author, creation date, etc.)</li>
          <li>Download or copy JSON output for further processing</li>
        </ul>
      </div>
    </div>
  );
}

export default PdfConverter;
