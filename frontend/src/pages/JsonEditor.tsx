/**
 * Zero-lag JSON Editor page
 * Main component that orchestrates file upload, editing, and export
 */

import { useEffect, useMemo } from "react";
import { useEquipmentDictionary } from "../hooks/useEquipmentDictionary";
import { useJsonEditorStore } from "../stores/json-editor.store";
import { equipmentApi } from "../api/equipment.api";
import { Download } from "lucide-react";
import { FileUpload } from "../components/json-editor/FileUpload";
import { FileList } from "../components/json-editor/FileList";
import { EquipmentSection } from "../components/json-editor/EquipmentSection";
import { EditorActions } from "../components/json-editor/EditorActions";
import { JsonFieldsPanel } from "../components/json-editor/JsonFieldsPanel";
import PageContainer from "../components/PageContainer";
import LoadSpinner from "../components/ui/LoadSpinner";
import { initializeCache } from "../utils/equipment-changes-manager";

export function JsonEditor() {
  // Initialize cache on component mount
  useEffect(() => {
    initializeCache();
  }, []);

  const { data: dictionary, isLoading, error } = useEquipmentDictionary();
  const workingJson = useJsonEditorStore((state) => state.workingJson);
  const originalJson = useJsonEditorStore((state) => state.originalJson);
  const files = useJsonEditorStore((state) => state.files);
  const exportAllAsDraft = useJsonEditorStore((state) => state.exportAllAsDraft);
  const areAllFilesValid = useJsonEditorStore((state) => state.areAllFilesValid);
  const isDirtyFn = useJsonEditorStore((state) => state.isDirty);
  const setDictionaryInfo = useJsonEditorStore((state) => state.setDictionaryInfo);
  const setTrashEquipment = useJsonEditorStore((state) => state.setTrashEquipment);
  const validateEquipment = useJsonEditorStore((state) => state.validateEquipment);
  
  // Selector for unsaved count - create array from Map values for proper reactivity
  // Zustand needs to see the actual values change, not just Map reference
  const unsavedCount = useJsonEditorStore((state) => {
    const filesArray = Array.from(state.files.values());
    return filesArray.filter(
      (fileData) => !fileData.isSaved || fileData.unknownEquipment.length > 0
    ).length;
  });

  // Fetch trash equipment and update dictionary info in store
  useEffect(() => {
    if (dictionary) {
      setDictionaryInfo(
        dictionary.version,
        dictionary.fetchedAt,
        dictionary.itemsByCode,
        dictionary.mappingsByRawValue
      );
      
      // Fetch trash equipment to filter out bin_trash items
      equipmentApi.getTrashEquipmentSet()
        .then((trashSet) => {
          setTrashEquipment(trashSet);
          // Re-validate equipment after trash set is loaded to filter out trash items
          if (workingJson?.equipment) {
            validateEquipment(workingJson.equipment);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch trash equipment:", err);
          // Continue without trash filtering if fetch fails
        });
    }
  }, [dictionary, setDictionaryInfo, setTrashEquipment, workingJson?.equipment, validateEquipment]);

  // Validate equipment when dictionary or JSON changes
  useEffect(() => {
    if (dictionary && workingJson?.equipment) {
      validateEquipment(workingJson.equipment);
    }
  }, [dictionary, workingJson?.equipment, validateEquipment]);

  // Compute isDirty reactively
  const isDirty = useMemo(() => {
    return isDirtyFn();
  }, [isDirtyFn, originalJson, workingJson]);

  // Warn user before closing tab/browser if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Check if there are any files loaded
      if (files.size === 0) return;

      // Check if there are unsaved changes
      const hasUnsavedChanges = isDirtyFn();
      
      // Check if there are files that aren't validated/saved
      const hasUnvalidatedFiles = Array.from(files.values()).some(
        (fileData) => !fileData.isSaved || fileData.unknownEquipment.length > 0
      );

      if (hasUnsavedChanges || hasUnvalidatedFiles) {
        // Modern browsers ignore custom messages, but we can still trigger the dialog
        e.preventDefault();
        // Chrome requires returnValue to be set
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [files, isDirtyFn]);

  // Show loading spinner only for initial load (not when using cached data)
  const isInitialLoad = isLoading && !dictionary && !error;

  return (
    <div className="bg-background text-foreground min-h-screen py-8">
      <PageContainer>
        <h1 className="text-3xl font-bold mb-6">JSON Editor</h1>
        <p className="text-muted-foreground mb-6">
          Upload, edit, and validate car JSON files
        </p>

        {/* Show warning if dictionary failed to load but allow UI to work */}
        {error && !dictionary && (
          <div className="mb-4 bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-3">
            <p className="text-yellow-300 text-sm">
              ⚠️ Warning: Could not connect to backend server. Equipment validation may be limited. 
              {error.message.includes("CONNECTION_REFUSED") && (
                <span className="block mt-1 text-xs text-yellow-400">
                  Make sure the backend URL is reachable and `VITE_API_BASE_URL`
                  (or `VITE_API_URL`) is set in production.
                </span>
              )}
            </p>
          </div>
        )}

        {/* Show info if using stale/cached data */}
        {dictionary?.stale && (
          <div className="mb-4 bg-blue-500/10 border border-blue-500/50 rounded-lg p-3">
            <p className="text-blue-300 text-sm">
              ℹ️ Using cached equipment dictionary. Some features may be limited.
            </p>
          </div>
        )}

        {/* Warning message with Save Draft button - positioned at top */}
        {/* Hide when all files are valid (green) */}
        {workingJson && files.size > 0 && !areAllFilesValid() && (unsavedCount > 0 || isDirty) && (
          <div className="max-w-6xl mx-auto mb-4">
            <div className="bg-orange-500/10 border border-orange-500/50 rounded-lg p-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="text-orange-300 text-sm font-medium">
                    ⚠️ You have unsaved progress
                  </p>
                  <p className="text-orange-200 text-xs mt-1">
                    {unsavedCount > 0 && (
                      <span>{unsavedCount} file{unsavedCount > 1 ? "s" : ""} need{unsavedCount > 1 ? "" : "s"} to be validated or saved.</span>
                    )}
                    {isDirty && (
                      <span className={unsavedCount > 0 ? " ml-1" : ""}>You have unsaved changes.</span>
                    )}
                    {" "}Click "Save Draft Progress" to save your work before closing the tab.
                  </p>
                </div>
                <button
                  onClick={async () => {
                    if (files.size === 0) return;
                    await exportAllAsDraft();
                  }}
                  disabled={files.size === 0}
                  className="px-4 py-2 text-sm bg-amber-600/80 text-white rounded hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-all shrink-0">
                  <Download className="h-4 w-4" />
                  Save Draft Progress
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Show loading spinner only on initial load */}
        {isInitialLoad ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadSpinner />
          </div>
        ) : (
          <div className="max-w-6xl mx-auto space-y-6">
            {/* File Upload */}
            <FileUpload />

            {/* File List - Shows all loaded files */}
            <FileList />

            {/* Main Editor */}
            {workingJson && (
              <div className="space-y-6">
                {/* JSON Fields Panel - Shows all fields with dropdowns */}
                <JsonFieldsPanel />

                {/* Equipment Section - Single section with validation */}
                <EquipmentSection dictionary={dictionary?.itemsByCode || {}} />
              </div>
            )}

            {/* Actions */}
            {workingJson && <EditorActions />}
          </div>
        )}
      </PageContainer>
    </div>
  );
}
