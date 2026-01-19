/**
 * Action buttons for export, reset, etc.
 */

import { Save } from "lucide-react";
import { useJsonEditorStore } from "../../stores/json-editor.store";
import { useMemo } from "react";

export function EditorActions() {
  const markFileAsValid = useJsonEditorStore((state) => state.markFileAsValid);
  const isDirtyFn = useJsonEditorStore((state) => state.isDirty);
  const activeFileName = useJsonEditorStore((state) => state.activeFileName);
  const originalJson = useJsonEditorStore((state) => state.originalJson);
  const workingJson = useJsonEditorStore((state) => state.workingJson);
  const originalHash = useJsonEditorStore((state) => state.originalHash);
  const unknownEquipment = useJsonEditorStore((state) => state.unknownEquipment);
  const dictionaryVersion = useJsonEditorStore((state) => state.dictionaryVersion);
  const dictionaryFetchedAt = useJsonEditorStore((state) => state.dictionaryFetchedAt);
  
  // Compute isDirty reactively based on state changes
  const isDirty = useMemo(() => {
    return isDirtyFn();
  }, [isDirtyFn, originalJson, workingJson, originalHash]);
  
  const handleSave = () => {
    if (!activeFileName) return;
    
    // Mark current file as valid (no unknown equipment)
    // This will check unknownEquipment and set isValid accordingly
    markFileAsValid(activeFileName);
    
    // Scroll to top after React updates the DOM (but don't change file)
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  const hasUnknownEquipment = unknownEquipment.length > 0;

  const lastFetchTime = useMemo(() => {
    if (!dictionaryFetchedAt) return null;
    return new Date(dictionaryFetchedAt).toLocaleTimeString();
  }, [dictionaryFetchedAt]);

  return (
    <div className="flex items-center justify-between border-t border-gray-200 pt-4">
      <div className="flex items-center gap-3">
        {/* Always show "Save" button */}
        <button
          onClick={handleSave}
          disabled={hasUnknownEquipment || !activeFileName}
          className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
          title={hasUnknownEquipment ? "Please handle all unknown equipment before saving" : "Save this file and mark as complete"}>
          <Save className="h-3 w-3" />
          Save
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
