/**
 * File List Component
 * Displays all loaded JSON files at the top with status indicators
 */

import { useMemo, useState } from "react";
import { CheckCircle2, Circle, FileText, Download } from "lucide-react";
import { useJsonEditorStore } from "../../stores/json-editor.store";

export function FileList() {
  const files = useJsonEditorStore((state) => state.files);
  const activeFileName = useJsonEditorStore((state) => state.activeFileName);
  const setActiveFile = useJsonEditorStore((state) => state.setActiveFile);
  const exportAllAsZip = useJsonEditorStore((state) => state.exportAllAsZip);
  const areAllFilesValid = useJsonEditorStore((state) => state.areAllFilesValid);
  const [isExporting, setIsExporting] = useState(false);
  
  // Memoize file list to prevent infinite loops
  const fileList = useMemo(() => {
    const list: Array<{ fileName: string; isValid: boolean; isActive: boolean }> = [];
    files.forEach((fileData, fileName) => {
      list.push({
        fileName,
        isValid: fileData.isValid,
        isActive: activeFileName === fileName,
      });
    });
    return list.sort((a, b) => a.fileName.localeCompare(b.fileName));
  }, [files, activeFileName]);

  const handleDownloadAll = async () => {
    if (!areAllFilesValid()) return;
    
    setIsExporting(true);
    try {
      await exportAllAsZip();
    } catch (error) {
      alert(`Failed to export: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsExporting(false);
    }
  };

  if (fileList.length === 0) {
    return null;
  }

  const allFilesValid = areAllFilesValid();

  return (
    <div className="bg-gray-800/40 border border-gray-700 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
          Loaded Files ({fileList.length})
        </h3>
        {/* Show "Download all" button when all files are valid */}
        {allFilesValid && (
          <button
            onClick={handleDownloadAll}
            disabled={isExporting}
            className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all">
            <Download className="h-3 w-3" />
            {isExporting ? "Exporting..." : "Download all"}
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {fileList.map((file) => (
          <button
            key={file.fileName}
            onClick={() => setActiveFile(file.fileName)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded border transition-all ${
              file.isActive
                ? "bg-blue-500/20 border-blue-500 text-blue-300 shadow-sm"
                : "bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
            }`}>
            {file.isValid ? (
              <CheckCircle2 className="h-3 w-3 text-green-400 shrink-0" />
            ) : (
              <Circle className="h-3 w-3 shrink-0" />
            )}
            <FileText className="h-3 w-3 shrink-0" />
            <span className="truncate max-w-[200px]">{file.fileName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
