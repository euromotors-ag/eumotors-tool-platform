/**
 * Zero-lag JSON Editor page
 * Main component that orchestrates file upload, editing, and export
 */

import { useEffect } from "react";
import { useEquipmentDictionary } from "../hooks/useEquipmentDictionary";
import { useJsonEditorStore } from "../stores/json-editor.store";
import { FileUpload } from "../components/json-editor/FileUpload";
import { FileList } from "../components/json-editor/FileList";
import { EquipmentSection } from "../components/json-editor/EquipmentSection";
import { EditorActions } from "../components/json-editor/EditorActions";
import { JsonFieldsPanel } from "../components/json-editor/JsonFieldsPanel";
import PageContainer from "../components/PageContainer";
import LoadSpinner from "../components/ui/LoadSpinner";

export function JsonEditor() {
  const { data: dictionary, isLoading, error } = useEquipmentDictionary();
  const workingJson = useJsonEditorStore((state) => state.workingJson);
  const setDictionaryInfo = useJsonEditorStore((state) => state.setDictionaryInfo);
  const validateEquipment = useJsonEditorStore((state) => state.validateEquipment);

  // Update dictionary info in store
  useEffect(() => {
    if (dictionary) {
      setDictionaryInfo(
        dictionary.version,
        dictionary.fetchedAt,
        dictionary.itemsByCode,
        dictionary.mappingsByRawValue
      );
    }
  }, [dictionary, setDictionaryInfo]);

  // Validate equipment when dictionary or JSON changes
  useEffect(() => {
    if (dictionary && workingJson?.equipment) {
      validateEquipment(workingJson.equipment);
    }
  }, [dictionary, workingJson?.equipment, validateEquipment]);

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
                  Make sure the backend server is running on port 3001.
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
