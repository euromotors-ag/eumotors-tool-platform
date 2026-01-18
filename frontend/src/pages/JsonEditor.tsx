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
      setDictionaryInfo(dictionary.version, dictionary.fetchedAt, dictionary.itemsByCode);
    }
  }, [dictionary, setDictionaryInfo]);

  // Validate equipment when dictionary or JSON changes
  useEffect(() => {
    if (dictionary && workingJson?.equipment) {
      validateEquipment(workingJson.equipment);
    }
  }, [dictionary, workingJson?.equipment, validateEquipment]);

  if (isLoading) {
    return (
      <div className="bg-background text-foreground min-h-screen py-8">
        <PageContainer>
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadSpinner />
          </div>
        </PageContainer>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-background text-foreground min-h-screen py-8">
        <PageContainer>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">
              Failed to load equipment dictionary: {error.message}
            </p>
          </div>
        </PageContainer>
      </div>
    );
  }

  if (!dictionary) {
    return (
      <div className="bg-background text-foreground min-h-screen py-8">
        <PageContainer>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800">
              Equipment dictionary not available. Please refresh the page.
            </p>
          </div>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="bg-background text-foreground min-h-screen py-8">
      <PageContainer>
        <h1 className="text-3xl font-bold mb-6">JSON Editor</h1>
        <p className="text-muted-foreground mb-6">
          Upload, edit, and validate car JSON files with zero-lag performance
        </p>

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
            <EquipmentSection dictionary={dictionary.itemsByCode} />
          </div>
        )}

          {/* Actions */}
          {workingJson && <EditorActions />}
        </div>
      </PageContainer>
    </div>
  );
}
