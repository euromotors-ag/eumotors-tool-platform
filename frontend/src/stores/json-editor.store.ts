/**
 * Zustand store for JSON editor state
 * Manages file, editing, validation, and change tracking
 */

import { create } from "zustand";
import {
  CarJson,
  JsonPatch,
  EquipmentValidationResult,
  EquipmentItem,
} from "../types/json-editor.types";

interface FileData {
  fileName: string;
  originalJson: CarJson;
  workingJson: CarJson;
  originalHash: string;
  patches: JsonPatch[];
  validationState: Record<string, EquipmentValidationResult>;
  unknownEquipment: string[];
  isSaved: boolean;
  fileHandle?: FileSystemFileHandle; // For File System Access API
}

interface JsonEditorState {
  // Multi-file state
  files: Map<string, FileData>; // fileName -> FileData
  activeFileName: string | null;

  // Current file state (for backward compatibility)
  originalJson: CarJson | null;
  workingJson: CarJson | null;
  originalHash: string | null;
  fileName: string | null;
  patches: JsonPatch[];
  validationState: Record<string, EquipmentValidationResult>;
  unknownEquipment: string[];

  // Dictionary state
  dictionaryVersion: string | null;
  dictionaryFetchedAt: number | null;
  dictionaryItems: Record<string, EquipmentItem>;

  // Actions
  loadFiles: (
    files: Array<{ name: string; json: CarJson; handle?: FileSystemFileHandle }>
  ) => void;
  setActiveFile: (fileName: string) => void;
  loadFile: (json: CarJson, fileName: string) => void;
  updateEquipment: (equipment: string[]) => void;
  updateField: (key: string, value: unknown) => void;
  addEquipment: (code: string) => void;
  addCustomEquipment: (code: string) => void;
  removeEquipment: (code: string) => void;
  mapEquipment: (oldCode: string, newCode: string) => void;
  resetToOriginal: () => void;
  saveCurrentFile: () => Promise<void>;
  markFileAsSaved: (fileName: string) => void;
  setDictionaryInfo: (
    version: string,
    fetchedAt: number,
    items: Record<string, EquipmentItem>
  ) => void;
  validateEquipment: (equipment: string[]) => void;

  // Computed
  isDirty: () => boolean;
  getWorkingJson: () => CarJson | null;
}

/**
 * Compute simple hash for JSON (for dirty checking)
 */
function computeHash(json: CarJson): string {
  const sorted = JSON.stringify(json, Object.keys(json).sort());
  // Simple hash function (not cryptographically secure, just for comparison)
  let hash = 0;
  for (let i = 0; i < sorted.length; i++) {
    const char = sorted.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substring(0, 16);
}

export const useJsonEditorStore = create<JsonEditorState>((set, get) => ({
  files: new Map(),
  activeFileName: null,
  originalJson: null,
  workingJson: null,
  originalHash: null,
  fileName: null,
  patches: [],
  validationState: {},
  unknownEquipment: [],
  dictionaryVersion: null,
  dictionaryFetchedAt: null,
  dictionaryItems: {},

  loadFiles: (
    files: Array<{ name: string; json: CarJson; handle?: FileSystemFileHandle }>
  ) => {
    const filesMap = new Map<string, FileData>();

    files.forEach(({ name, json, handle }) => {
      const normalizedJson: CarJson = {
        ...json,
        equipment: Array.isArray(json.equipment) ? json.equipment : [],
      };
      const hash = computeHash(normalizedJson);

      filesMap.set(name, {
        fileName: name,
        originalJson: normalizedJson,
        workingJson: normalizedJson,
        originalHash: hash,
        patches: [],
        validationState: {},
        unknownEquipment: [],
        isSaved: false,
        fileHandle: handle,
      });
    });

    // Set first file as active
    const firstFileName = files[0]?.name || null;

    set({
      files: filesMap,
      activeFileName: firstFileName,
    });

    // Load first file
    if (firstFileName) {
      get().setActiveFile(firstFileName);
    }
  },

  setActiveFile: (fileName: string) => {
    const state = get();
    const fileData = state.files.get(fileName);

    if (!fileData) return;

    // Save current file state before switching
    if (state.activeFileName && state.activeFileName !== fileName) {
      const currentFileData = state.files.get(state.activeFileName);
      if (currentFileData) {
        state.files.set(state.activeFileName, {
          ...currentFileData,
          workingJson: state.workingJson || currentFileData.workingJson,
          patches: state.patches,
          validationState: state.validationState,
          unknownEquipment: state.unknownEquipment,
        });
      }
    }

    // Load new file
    set({
      activeFileName: fileName,
      fileName: fileData.fileName,
      originalJson: fileData.originalJson,
      workingJson: fileData.workingJson,
      originalHash: fileData.originalHash,
      patches: fileData.patches,
      validationState: fileData.validationState,
      unknownEquipment: fileData.unknownEquipment,
    });

    // Validate equipment for new file
    if (fileData.workingJson.equipment) {
      get().validateEquipment(fileData.workingJson.equipment);
    }
  },

  loadFile: (json: CarJson, fileName: string) => {
    // Ensure equipment is always an array
    const normalizedJson: CarJson = {
      ...json,
      equipment: Array.isArray(json.equipment) ? json.equipment : [],
    };

    const hash = computeHash(normalizedJson);

    // If multi-file mode, add to files map
    const state = get();
    if (state.files.size > 0) {
      const fileData: FileData = {
        fileName,
        originalJson: normalizedJson,
        workingJson: normalizedJson,
        originalHash: hash,
        patches: [],
        validationState: {},
        unknownEquipment: [],
        isSaved: false,
      };
      state.files.set(fileName, fileData);
      set({ files: new Map(state.files), activeFileName: fileName });
      get().setActiveFile(fileName);
    } else {
      // Single file mode (backward compatibility)
      set({
        originalJson: normalizedJson,
        workingJson: normalizedJson,
        originalHash: hash,
        fileName,
        patches: [],
        validationState: {},
        unknownEquipment: [],
      });
    }
  },

  updateEquipment: (equipment: string[]) => {
    const state = get();
    if (!state.workingJson || !state.activeFileName) return;

    const patch: JsonPatch = {
      op: "replace",
      path: "/equipment",
      value: equipment,
      oldValue: state.workingJson.equipment,
    };

    const newPatches = [...state.patches, patch];

    set({
      workingJson: {
        ...state.workingJson,
        equipment,
      },
      patches: newPatches,
    });

    // Update file data in map
    const fileData = state.files.get(state.activeFileName);
    if (fileData) {
      state.files.set(state.activeFileName, {
        ...fileData,
        workingJson: {
          ...state.workingJson,
          equipment,
        },
        patches: newPatches,
      });
    }

    // Trigger validation
    get().validateEquipment(equipment);
  },

  updateField: (key: string, value: unknown) => {
    const state = get();
    if (!state.workingJson || !state.activeFileName) return;

    const patch: JsonPatch = {
      op: "replace",
      path: `/${key}`,
      value,
      oldValue: (state.workingJson as Record<string, unknown>)[key],
    };

    const newWorkingJson = {
      ...state.workingJson,
      [key]: value,
    } as CarJson;
    const newPatches = [...state.patches, patch];

    set({
      workingJson: newWorkingJson,
      patches: newPatches,
    });

    // Update file data in map
    const fileData = state.files.get(state.activeFileName);
    if (fileData) {
      state.files.set(state.activeFileName, {
        ...fileData,
        workingJson: newWorkingJson,
        patches: newPatches,
      });
    }

    // If updating equipment field, trigger validation
    if (key === "equipment" && Array.isArray(value)) {
      get().validateEquipment(value);
    }
  },

  addEquipment: (code: string) => {
    const state = get();
    if (!state.workingJson || !state.activeFileName) return;

    const currentEquipment = state.workingJson.equipment || [];
    if (currentEquipment.includes(code)) return;

    const newEquipment = [...currentEquipment, code];
    get().updateEquipment(newEquipment);
  },

  addCustomEquipment: (code: string) => {
    const state = get();
    if (!state.workingJson || !state.activeFileName) return;

    const currentEquipment = state.workingJson.equipment || [];
    const trimmedCode = code.trim();
    if (!trimmedCode || currentEquipment.includes(trimmedCode)) return;

    const newEquipment = [...currentEquipment, trimmedCode];

    // Update equipment
    const patch: JsonPatch = {
      op: "replace",
      path: "/equipment",
      value: newEquipment,
      oldValue: state.workingJson.equipment,
    };

    const newPatches = [...state.patches, patch];

    set({
      workingJson: {
        ...state.workingJson,
        equipment: newEquipment,
      },
      patches: newPatches,
    });

    // Mark as custom (not validated against database)
    const newValidationState = {
      ...state.validationState,
      [trimmedCode]: {
        code: trimmedCode,
        status: "custom" as const,
      },
    };

    set({ validationState: newValidationState });

    // Update file data in map
    const fileData = state.files.get(state.activeFileName);
    if (fileData) {
      state.files.set(state.activeFileName, {
        ...fileData,
        workingJson: {
          ...state.workingJson,
          equipment: newEquipment,
        },
        patches: newPatches,
        validationState: newValidationState,
      });
    }
  },

  removeEquipment: (code: string) => {
    const state = get();
    if (!state.workingJson || !state.activeFileName) return;

    const currentEquipment = state.workingJson.equipment || [];
    const newEquipment = currentEquipment.filter((c) => c !== code);
    get().updateEquipment(newEquipment);
  },

  mapEquipment: (oldCode: string, newCode: string) => {
    const state = get();
    if (!state.workingJson || !state.activeFileName) return;

    const currentEquipment = state.workingJson.equipment || [];
    const newEquipment = currentEquipment.map((c) =>
      c === oldCode ? newCode : c
    );
    get().updateEquipment(newEquipment);
  },

  resetToOriginal: () => {
    const state = get();
    if (!state.originalJson || !state.activeFileName) return;

    set({
      workingJson: state.originalJson,
      patches: [],
      validationState: {},
      unknownEquipment: [],
    });

    // Update file data in map
    const fileData = state.files.get(state.activeFileName);
    if (fileData) {
      state.files.set(state.activeFileName, {
        ...fileData,
        workingJson: state.originalJson,
        patches: [],
        validationState: {},
        unknownEquipment: [],
      });
    }
  },

  saveCurrentFile: async () => {
    const state = get();
    if (!state.activeFileName || !state.workingJson) return;

    const fileData = state.files.get(state.activeFileName);
    if (!fileData) return;

    try {
      // Use File System Access API if available, otherwise download
      if (fileData.fileHandle && "createWritable" in fileData.fileHandle) {
        const writable = await fileData.fileHandle.createWritable();
        const jsonString = JSON.stringify(state.workingJson, null, 2);
        await writable.write(jsonString);
        await writable.close();
      } else {
        // Fallback: trigger download
        const jsonString = JSON.stringify(state.workingJson, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = state.activeFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      // Mark as saved
      get().markFileAsSaved(state.activeFileName);
    } catch (error) {
      console.error("Failed to save file:", error);
      throw error;
    }
  },

  markFileAsSaved: (fileName: string) => {
    const state = get();
    const fileData = state.files.get(fileName);
    if (!fileData) return;

    const updatedFileData: FileData = {
      ...fileData,
      isSaved: true,
      originalJson: fileData.workingJson, // Update original to current state
      originalHash: computeHash(fileData.workingJson),
      patches: [],
    };

    state.files.set(fileName, updatedFileData);

    // If this is the active file, update state
    if (state.activeFileName === fileName) {
      set({
        originalJson: updatedFileData.originalJson,
        originalHash: updatedFileData.originalHash,
        patches: [],
      });
    }
  },

  setDictionaryInfo: (
    version: string,
    fetchedAt: number,
    items: Record<string, EquipmentItem>
  ) => {
    set({
      dictionaryVersion: version,
      dictionaryFetchedAt: fetchedAt,
      dictionaryItems: items,
    });
  },

  validateEquipment: (equipment: string[]) => {
    const state = get();
    const dictionary = state.dictionaryItems;
    const validationState: Record<string, EquipmentValidationResult> = {};
    const unknownEquipment: string[] = [];

    for (const code of equipment) {
      // Preserve custom status if already set
      const existingStatus = state.validationState[code]?.status;
      if (existingStatus === "custom") {
        validationState[code] = {
          code,
          status: "custom",
        };
        continue;
      }

      if (dictionary[code]) {
        validationState[code] = {
          code,
          status: "valid",
        };
      } else {
        validationState[code] = {
          code,
          status: "unknown",
          reason: "Not found in equipment dictionary",
        };
        unknownEquipment.push(code);
      }
    }

    set({
      validationState,
      unknownEquipment,
    });

    // Update file data in map if active file exists
    if (state.activeFileName) {
      const fileData = state.files.get(state.activeFileName);
      if (fileData) {
        state.files.set(state.activeFileName, {
          ...fileData,
          validationState,
          unknownEquipment,
        });
      }
    }
  },

  isDirty: () => {
    const state = get();
    if (!state.originalJson || !state.workingJson) return false;
    const currentHash = computeHash(state.workingJson);
    return currentHash !== state.originalHash;
  },

  getWorkingJson: () => {
    return get().workingJson;
  },
}));
