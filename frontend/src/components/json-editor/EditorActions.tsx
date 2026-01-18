/**
 * Action buttons for export, reset, etc.
 */

import { Download, RotateCcw, Save } from "lucide-react";
import { useJsonEditorStore } from "../../stores/json-editor.store";
import { useMemo, useState } from "react";

export function EditorActions() {
  const getWorkingJson = useJsonEditorStore((state) => state.getWorkingJson);
  const resetToOriginal = useJsonEditorStore((state) => state.resetToOriginal);
  const saveCurrentFile = useJsonEditorStore((state) => state.saveCurrentFile);
  const isDirty = useJsonEditorStore((state) => state.isDirty());
  const fileName = useJsonEditorStore((state) => state.fileName);
  const activeFileName = useJsonEditorStore((state) => state.activeFileName);
  const files = useJsonEditorStore((state) => state.files);
  const dictionaryVersion = useJsonEditorStore((state) => state.dictionaryVersion);
  const dictionaryFetchedAt = useJsonEditorStore((state) => state.dictionaryFetchedAt);
  const [isSaving, setIsSaving] = useState(false);
  
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

  const handleExport = () => {
    const json = getWorkingJson();
    if (!json) return;

    const jsonString = JSON.stringify(json, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "car-data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    if (!activeFileName) return;
    
    setIsSaving(true);
    try {
      await saveCurrentFile();
    } catch (error) {
      alert(`Failed to save: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const hasUnsavedFiles = isDirty && activeFileName !== null;

  const lastFetchTime = useMemo(() => {
    if (!dictionaryFetchedAt) return null;
    return new Date(dictionaryFetchedAt).toLocaleTimeString();
  }, [dictionaryFetchedAt]);

  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
      <div className="flex items-center gap-3">
        {fileList.length > 1 && (
          <button
            onClick={handleSave}
            disabled={!hasUnsavedFiles || isSaving}
            className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all">
            <Save className="h-3 w-3" />
            {isSaving ? "Saving..." : "Save"}
          </button>
        )}
        
        <button
          onClick={handleExport}
          disabled={!getWorkingJson()}
          className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all">
          <Download className="h-3 w-3" />
          Export JSON
        </button>

        <button
          onClick={resetToOriginal}
          disabled={!isDirty}
          className="px-3 py-1.5 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all">
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>

        {isDirty && (
          <span className="text-xs text-orange-600 flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-orange-600 rounded-full"></span>
            Unsaved
          </span>
        )}
      </div>

      <div className="text-xs text-gray-500">
        {dictionaryVersion && (
          <div>
            Dictionary v{dictionaryVersion}
            {lastFetchTime && ` • ${lastFetchTime}`}
          </div>
        )}
      </div>
    </div>
  );
}
