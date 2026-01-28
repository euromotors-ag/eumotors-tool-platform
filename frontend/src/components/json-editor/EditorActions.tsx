/**
 * Action buttons for export, reset, etc.
 */

import { Save } from "lucide-react";
import { useJsonEditorStore } from "../../stores/json-editor.store";
import { useMemo, useState } from "react";
import { equipmentApi } from "../../api/equipment.api";
import { getAllPendingChanges, clearPendingChanges, flushPendingWrites } from "../../utils/equipment-changes-manager";
import { useQueryClient } from "@tanstack/react-query";
import { clearEquipmentDictionaryCache } from "../../hooks/useEquipmentDictionary";

export function EditorActions() {
  const markFileAsValid = useJsonEditorStore((state) => state.markFileAsValid);
  const clearEquipmentActionHistory = useJsonEditorStore((state) => state.clearEquipmentActionHistory);
  const isDirtyFn = useJsonEditorStore((state) => state.isDirty);
  const activeFileName = useJsonEditorStore((state) => state.activeFileName);
  const originalJson = useJsonEditorStore((state) => state.originalJson);
  const workingJson = useJsonEditorStore((state) => state.workingJson);
  const originalHash = useJsonEditorStore((state) => state.originalHash);
  const unknownEquipment = useJsonEditorStore((state) => state.unknownEquipment);
  const dictionaryVersion = useJsonEditorStore((state) => state.dictionaryVersion);
  const dictionaryFetchedAt = useJsonEditorStore((state) => state.dictionaryFetchedAt);
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  
  // Compute isDirty reactively based on state changes
  const isDirty = useMemo(() => {
    return isDirtyFn();
  }, [isDirtyFn, originalJson, workingJson, originalHash]);
  
  const handleSave = async () => {
    if (!activeFileName || hasUnknownEquipment) return;
    
    setIsSaving(true);
    
    try {
      // Flush all pending writes to ensure we have the latest changes
      flushPendingWrites();
      
      // Get all pending changes for the current file
      const pendingChanges = getAllPendingChanges().get(activeFileName) || [];
      
      if (pendingChanges.length > 0) {
        // Batch sync all changes to Supabase
        const result = await equipmentApi.batchSync(pendingChanges);
        
        if (result.status === "error") {
          // All changes failed
          const errorMessages = result.results
            .filter((r) => !r.success)
            .map((r) => r.error)
            .join(", ");
          alert(`Failed to save changes: ${errorMessages}`);
          return;
        } else if (result.status === "partial") {
          // Some changes failed
          const failedChanges = result.results.filter((r) => !r.success);
          const errorMessages = failedChanges.map((r) => r.error).join(", ");
          alert(`Some changes failed to save: ${errorMessages}`);
          // Continue anyway - successful changes are saved
        }
        
        // Clear pending changes for this file (successful sync)
        clearPendingChanges(activeFileName);
        
        // Clear localStorage cache to force fresh fetch (equipment dictionary may have changed)
        clearEquipmentDictionaryCache();
        
        // Invalidate React Query cache and force refetch
        await queryClient.invalidateQueries({ queryKey: ["equipment-dictionary"] });
        await queryClient.invalidateQueries({ queryKey: ["canonical-equipment"] });
        
        // Force refetch to get fresh data from server
        await queryClient.refetchQueries({ queryKey: ["equipment-dictionary"] });
        await queryClient.refetchQueries({ queryKey: ["canonical-equipment"] });
      }
      
      // Clear undo history for this file (changes are now saved, cannot be undone)
      clearEquipmentActionHistory(activeFileName);
      
      // Mark current file as valid (no unknown equipment)
      markFileAsValid(activeFileName);
      
      // Scroll to top after React updates the DOM
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error("Failed to save changes:", error);
      alert(
        `Failed to save changes: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      setIsSaving(false);
    }
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
          disabled={hasUnknownEquipment || !activeFileName || isSaving}
          className="px-3 py-1.5 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
          title={hasUnknownEquipment ? "Please handle all unknown equipment before saving" : "Save this file and sync equipment changes to database"}>
          <Save className="h-3 w-3" />
          {isSaving ? "Saving..." : "Save"}
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
