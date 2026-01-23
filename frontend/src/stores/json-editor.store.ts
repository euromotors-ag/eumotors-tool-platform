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
  relativePath?: string; // Relative path from folder root (e.g., "car1/listing.json")
  originalJson: CarJson;
  workingJson: CarJson;
  originalHash: string;
  patches: JsonPatch[];
  validationState: Record<string, EquipmentValidationResult>;
  unknownEquipment: string[];
  isSaved: boolean;
  isValid: boolean; // True when all equipment is validated (green status)
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
  dictionaryMappings: Record<string, string | string[]>; // Maps raw value (uppercase) to canonical code(s) from dictionary - string for single, string[] for multi-mapping
  trashEquipment: Set<string>; // Set of equipment names marked as bin_trash (uppercase)

  // Session-level equipment overlay (tracks CRUD changes in current session)
  equipmentOverlay: {
    // Maps raw code to canonical code(s) (for mapped equipment)
    // string for single mapping, string[] for multi-mapping
    mappedCodes: Record<string, string | string[]>;
    // Set of codes added to database in this session
    addedCodes: Set<string>;
    // Set of codes marked as trash in this session
    trashedCodes: Set<string>;
  };

  // Actions
  loadFiles: (
    files: Array<{ name: string; json: CarJson; handle?: FileSystemFileHandle; relativePath?: string }>
  ) => void;
  setActiveFile: (fileName: string) => void;
  loadFile: (json: CarJson, fileName: string) => void;
  updateEquipment: (equipment: string[]) => void;
  updateField: (key: string, value: unknown) => void;
  addEquipment: (code: string) => void;
  addCustomEquipment: (code: string) => void;
  markEquipmentAsCustom: (code: string) => void;
  removeEquipment: (code: string) => void;
  mapEquipment: (oldCode: string, newCode: string) => void;
  resetToOriginal: () => void;
  clearAllFiles: () => void;
  saveCurrentFile: () => Promise<void>;
  markFileAsSaved: (fileName: string) => void;
  markFileAsValid: (fileName: string) => void;
  restoreValidationStatusFromMetadata: (metadata: {
    version: string;
    savedAt: string;
    files: Record<string, { isValidated: boolean; status: "green" | "yellow" | "red"; unknownCount?: number }>;
  }) => void;
  navigateToNextFile: () => void;
  navigateToPreviousFile: () => void;
  isLastFile: () => boolean;
  exportAllAsZip: () => Promise<void>;
  exportAllAsDraft: () => Promise<void>;
  setDictionaryInfo: (
    version: string,
    fetchedAt: number,
    items: Record<string, EquipmentItem>,
    mappings?: Record<string, string>
  ) => void;
  setTrashEquipment: (trashSet: Set<string>) => void;
  validateEquipment: (equipment: string[]) => void;
  
  // Equipment overlay actions (for CRUD tracking)
  recordEquipmentMapping: (rawCode: string, canonicalCode: string | string[]) => void;
  recordEquipmentAdded: (code: string) => void;
  recordEquipmentTrashed: (code: string) => void;

  // Computed
  isDirty: () => boolean;
  getWorkingJson: () => CarJson | null;
  isFileValid: (fileName: string) => boolean;
  areAllFilesValid: () => boolean;
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

/**
 * Convert equipment values (codes/raw values) to equipment names
 * This ensures JSON always contains equipment names, not codes or raw values
 * Also filters out trash equipment (bin_trash)
 */
function convertEquipmentToNames(
  equipment: string[],
  dictionaryItems: Record<string, EquipmentItem>,
  dictionaryMappings: Record<string, string | string[]>,
  overlayMappedCodes: Record<string, string | string[]>,
  trashEquipment?: Set<string>
): string[] {
  const uniqueNames = new Set<string>();

  equipment.forEach((value) => {
    // First, check if equipment is in trash - filter it out completely
    if (trashEquipment) {
      const codeUpper = value.toUpperCase();
      const underscoreVersion = codeUpper.replace(/[\s\-]/g, "_");
      const spaceVersion = codeUpper.replace(/[_\-]/g, " ");
      
      // Skip trash equipment
      if (
        trashEquipment.has(codeUpper) ||
        trashEquipment.has(underscoreVersion) ||
        trashEquipment.has(spaceVersion)
      ) {
        return; // Skip this equipment - it's in trash
      }
    }

    // Handle multi-mapping expansion: if value maps to multiple names, expand to all
    const mappedValue = overlayMappedCodes[value] || (() => {
      const codeUpper = value.toUpperCase();
      const underscoreVersion = codeUpper.replace(/[\s\-]/g, "_");
      return dictionaryMappings[codeUpper] || dictionaryMappings[underscoreVersion] || null;
    })();

    // If mappedValue is an array (multi-mapping), expand to all values
    if (Array.isArray(mappedValue)) {
      mappedValue.forEach((name) => {
        if (name && trashEquipment) {
          const nameUpper = name.toUpperCase();
          const nameUnderscore = nameUpper.replace(/[\s\-]/g, "_");
          const nameSpace = nameUpper.replace(/[_\-]/g, " ");
          
          if (
            !trashEquipment.has(nameUpper) &&
            !trashEquipment.has(nameUnderscore) &&
            !trashEquipment.has(nameSpace)
          ) {
            uniqueNames.add(name);
          }
        } else if (name) {
          uniqueNames.add(name);
        }
      });
      return; // Skip to next equipment value
    }

    // Single mapping (backward compatibility)
    let equipmentName: string | null = mappedValue;

    // 3. If not mapped, check if value is a code in dictionary - get name from dictionary
    if (!equipmentName) {
      const dictionaryItem = dictionaryItems[value];
      if (dictionaryItem) {
        equipmentName = dictionaryItem.name;
      } else {
        // 4. Check if value is already a name (exists in dictionary values)
        const existingItem = Object.values(dictionaryItems).find(
          (item) => item.name === value
        );
        if (existingItem) {
          equipmentName = value; // Already a name
        } else {
          // 5. Keep as-is (custom or unknown - will be handled later)
          equipmentName = value;
        }
      }
    }

    // Double-check: don't add if equipment name is in trash
    if (equipmentName && trashEquipment) {
      const nameUpper = equipmentName.toUpperCase();
      const nameUnderscore = nameUpper.replace(/[\s\-]/g, "_");
      const nameSpace = nameUpper.replace(/[_\-]/g, " ");
      
      if (
        trashEquipment.has(nameUpper) ||
        trashEquipment.has(nameUnderscore) ||
        trashEquipment.has(nameSpace)
      ) {
        return; // Skip - equipment name is in trash
      }
    }

    if (equipmentName) {
      uniqueNames.add(equipmentName);
    }
  });

  return Array.from(uniqueNames).sort();
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
  dictionaryMappings: {},
  trashEquipment: new Set<string>(),
  equipmentOverlay: {
    mappedCodes: {}, // Record<string, string | string[]>
    addedCodes: new Set<string>(),
    trashedCodes: new Set<string>(),
  },

  loadFiles: (
    files: Array<{ name: string; json: CarJson; handle?: FileSystemFileHandle; relativePath?: string }>
  ) => {
    const filesMap = new Map<string, FileData>();
    const state = get();

    files.forEach(({ name, json, handle, relativePath }) => {
      // Convert equipment values to equipment names immediately when loading
      // This ensures JSON always contains names, not codes or raw values
      // Also filters out trash equipment (bin_trash)
      const equipmentArray = Array.isArray(json.equipment) ? json.equipment : [];
      const equipmentNames = convertEquipmentToNames(
        equipmentArray,
        state.dictionaryItems,
        state.dictionaryMappings,
        state.equipmentOverlay.mappedCodes,
        state.trashEquipment
      );

      const normalizedJson: CarJson = {
        ...json,
        equipment: equipmentNames,
      };
      const hash = computeHash(normalizedJson);

      // Use relativePath as key if available, otherwise use name
      // This ensures unique keys for files with same name in different folders
      const mapKey = relativePath || name;

      filesMap.set(mapKey, {
        fileName: name,
        relativePath,
        originalJson: normalizedJson,
        workingJson: normalizedJson,
        originalHash: hash,
        patches: [],
        validationState: {},
        unknownEquipment: [],
        isSaved: false,
        isValid: false,
        fileHandle: handle,
      });
    });

    // Set first file as active - use mapKey (relativePath or name)
    const firstFile = files[0];
    const firstMapKey = firstFile?.relativePath || firstFile?.name || null;

    set({
      files: filesMap,
      activeFileName: firstMapKey,
    });

    // Load first file
    if (firstMapKey) {
      get().setActiveFile(firstMapKey);
    }
  },

  setActiveFile: (fileName: string) => {
    const state = get();
    const fileData = state.files.get(fileName);

    if (!fileData) return;

    // Save current file state before switching (create new Map to trigger re-render)
    // IMPORTANT: Don't change isValid here - only markFileAsValid should set it to true
    if (state.activeFileName && state.activeFileName !== fileName) {
      const currentFileData = state.files.get(state.activeFileName);
      if (currentFileData) {
        const newFilesMap = new Map(state.files);
        newFilesMap.set(state.activeFileName, {
          ...currentFileData,
          workingJson: state.workingJson || currentFileData.workingJson,
          patches: state.patches,
          validationState: state.validationState,
          unknownEquipment: state.unknownEquipment,
          // Don't change isValid - preserve existing value (only markFileAsValid sets it to true)
        });
        state.files = newFilesMap;
      }
    }

    // Load new file - apply overlay changes (mappings/trash) to equipment if needed
    // This ensures that overlay changes made in previous files are applied to all files
    let fileWorkingJson = fileData.workingJson;
    const equipmentArray = fileData.workingJson.equipment || [];
    
    // Apply overlay mappings: if any equipment matches a mapped code, replace it
    const overlay = state.equipmentOverlay;
    let equipmentUpdated = false;
    const updatedEquipment = equipmentArray
      .filter((code) => {
        // Filter out trashed equipment
        if (overlay.trashedCodes.has(code)) {
          equipmentUpdated = true;
          return false;
        }
        return true;
      })
      .map((code) => {
        // Apply mappings: if code is mapped to a canonical name, use that instead
        if (overlay.mappedCodes[code]) {
          equipmentUpdated = true;
          return overlay.mappedCodes[code];
        }
        return code;
      });
    
    // Remove duplicates after mapping
    const uniqueEquipment = Array.from(new Set(updatedEquipment));
    
    if (equipmentUpdated || uniqueEquipment.length !== equipmentArray.length) {
      fileWorkingJson = {
        ...fileData.workingJson,
        equipment: uniqueEquipment,
      };
      
      // Update file data in Map
      const newFilesMap = new Map(state.files);
      newFilesMap.set(fileName, {
        ...fileData,
        workingJson: fileWorkingJson,
      });
      set({ files: newFilesMap });
    }

    // Ensure originalHash is computed correctly
    const fileOriginalHash = fileData.originalHash || computeHash(fileData.originalJson);

    set({
      activeFileName: fileName,
      fileName: fileData.fileName,
      originalJson: fileData.originalJson,
      workingJson: fileWorkingJson,
      originalHash: fileOriginalHash,
      patches: fileData.patches,
      validationState: fileData.validationState,
      unknownEquipment: fileData.unknownEquipment,
    });

    // Validate equipment for new file
    if (fileWorkingJson.equipment) {
      get().validateEquipment(fileWorkingJson.equipment);
    }
  },

  loadFile: (json: CarJson, fileName: string) => {
    // Convert equipment values to equipment names immediately when loading
    // This ensures JSON always contains names, not codes or raw values
    // Also filters out trash equipment (bin_trash)
    const state = get();
    const equipmentArray = Array.isArray(json.equipment) ? json.equipment : [];
    const equipmentNames = convertEquipmentToNames(
      equipmentArray,
      state.dictionaryItems,
      state.dictionaryMappings,
      state.equipmentOverlay.mappedCodes,
      state.trashEquipment
    );

    const normalizedJson: CarJson = {
      ...json,
      equipment: equipmentNames,
    };

    const hash = computeHash(normalizedJson);

    const fileData: FileData = {
      fileName,
      originalJson: normalizedJson,
      workingJson: normalizedJson,
      originalHash: hash,
      patches: [],
      validationState: {},
      unknownEquipment: [],
      isSaved: false,
      isValid: false,
    };

    const filesMap = new Map<string, FileData>();
    filesMap.set(fileName, fileData);
    set({ files: filesMap, activeFileName: fileName });
    get().setActiveFile(fileName);
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

  markEquipmentAsCustom: (code: string) => {
    const state = get();
    if (!state.workingJson || !state.activeFileName) return;

    // Update validation state to mark as custom
    const newValidationState = {
      ...state.validationState,
      [code]: {
        code,
        status: "custom" as const,
      },
    };

    // Remove from unknownEquipment array if present
    const newUnknownEquipment = state.unknownEquipment.filter((c) => c !== code);

    set({
      validationState: newValidationState,
      unknownEquipment: newUnknownEquipment,
    });

    // Update file data in map
    const fileData = state.files.get(state.activeFileName);
    if (fileData) {
      const isValid = newUnknownEquipment.length === 0;
      state.files.set(state.activeFileName, {
        ...fileData,
        validationState: newValidationState,
        unknownEquipment: newUnknownEquipment,
        isValid,
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
  clearAllFiles: () => {
    set({
      files: new Map(),
      activeFileName: null,
      originalJson: null,
      workingJson: null,
      originalHash: null,
      fileName: null,
      patches: [],
      validationState: {},
      unknownEquipment: [],
      equipmentOverlay: {
        mappedCodes: {},
        addedCodes: new Set<string>(),
        trashedCodes: new Set<string>(),
      },
    });
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

  markFileAsValid: (fileName: string) => {
    const state = get();
    const fileData = state.files.get(fileName);
    if (!fileData) return;

    // If this is the active file, save current state first (like navigateToNextFile does)
    const isActiveFile = state.activeFileName === fileName;
    let workingJson = fileData.workingJson;
    let unknownEquip = fileData.unknownEquipment;
    let patches = fileData.patches;
    let validationState = fileData.validationState;
    
    if (isActiveFile) {
      // Save current working state
      workingJson = state.workingJson || fileData.workingJson;
      unknownEquip = state.unknownEquipment;
      patches = state.patches;
      validationState = state.validationState;
    }

    // Check if file is actually valid (no unknown equipment)
    const isValid = unknownEquip.length === 0;

    // Update originalJson to match workingJson to clear "Unsaved" status
    const updatedFileData: FileData = {
      ...fileData,
      originalJson: workingJson, // Set original to current state (marks as saved)
      originalHash: computeHash(workingJson), // Update hash for dirty checking
      workingJson: workingJson,
      unknownEquipment: unknownEquip,
      patches: [], // Clear patches when saving
      validationState: validationState,
      isValid,
      isSaved: isValid, // Mark as saved if valid (no unknown equipment)
    };

    // Update Map and trigger Zustand re-render by creating new Map reference
    const newFilesMap = new Map(state.files);
    newFilesMap.set(fileName, updatedFileData);
    set({ files: newFilesMap });

    // If this is the active file, also update the main state to clear "Unsaved"
    if (isActiveFile) {
      set({
        originalJson: workingJson,
        originalHash: computeHash(workingJson),
        patches: [],
      });
    }
  },

  restoreValidationStatusFromMetadata: (metadata: {
    version: string;
    savedAt: string;
    files: Record<string, { isValidated: boolean; status: "green" | "yellow" | "red"; unknownCount?: number }>;
  }) => {
    const state = get();
    const newFilesMap = new Map(state.files);
    let hasUpdates = false;

    // Restore validation status for each file that exists in metadata
    newFilesMap.forEach((fileData, fileName) => {
      const metadataEntry = metadata.files[fileData.fileName];
      if (metadataEntry) {
        // Restore validation status from metadata
        const updatedFileData: FileData = {
          ...fileData,
          isValid: metadataEntry.isValidated,
          isSaved: metadataEntry.isValidated, // Mark as saved if it was validated
        };
        newFilesMap.set(fileName, updatedFileData);
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      set({ files: newFilesMap });
    }
  },

  navigateToNextFile: () => {
    const state = get();
    if (!state.activeFileName || state.files.size <= 1) return;

    // Save current file state before switching
    const currentFileData = state.files.get(state.activeFileName);
    if (currentFileData) {
      state.files.set(state.activeFileName, {
        ...currentFileData,
        workingJson: state.workingJson || currentFileData.workingJson,
        patches: state.patches,
        validationState: state.validationState,
        unknownEquipment: state.unknownEquipment,
        isValid: state.unknownEquipment.length === 0,
      });
    }

    // Find next file
    const fileList = Array.from(state.files.keys()).sort((a, b) => a.localeCompare(b));
    const currentIndex = fileList.indexOf(state.activeFileName);
    const nextIndex = (currentIndex + 1) % fileList.length;
    const nextFileName = fileList[nextIndex];

    // Navigate to next file
    if (nextFileName) {
      get().setActiveFile(nextFileName);
    }
  },

  navigateToPreviousFile: () => {
    const state = get();
    if (!state.activeFileName || state.files.size <= 1) return;

    // Save current file state before switching
    // IMPORTANT: Don't change isValid here - only markFileAsValid should set it to true
    const currentFileData = state.files.get(state.activeFileName);
    if (currentFileData) {
      const newFilesMap = new Map(state.files);
      newFilesMap.set(state.activeFileName, {
        ...currentFileData,
        workingJson: state.workingJson || currentFileData.workingJson,
        patches: state.patches,
        validationState: state.validationState,
        unknownEquipment: state.unknownEquipment,
        // Don't change isValid - preserve existing value (only markFileAsValid sets it to true)
      });
      set({ files: newFilesMap });
    }

    // Find previous file
    const fileList = Array.from(state.files.keys()).sort((a, b) => a.localeCompare(b));
    const currentIndex = fileList.indexOf(state.activeFileName);
    const previousIndex = currentIndex === 0 ? fileList.length - 1 : currentIndex - 1;
    const previousFileName = fileList[previousIndex];

    // Navigate to previous file
    if (previousFileName) {
      get().setActiveFile(previousFileName);
    }
  },

  isLastFile: () => {
    const state = get();
    if (!state.activeFileName || state.files.size <= 1) return false;

    const fileList = Array.from(state.files.keys()).sort((a, b) => a.localeCompare(b));
    const currentIndex = fileList.indexOf(state.activeFileName);
    return currentIndex === fileList.length - 1;
  },

  exportAllAsZip: async () => {
    const state = get();
    if (state.files.size === 0) return;

    // Dynamic import to avoid bundle size issues
    const JSZip = (await import("jszip")).default;
    const { saveAs } = await import("file-saver");

    const zip = new JSZip();

    // Helper function to convert equipment values to equipment names
    const convertEquipmentToNames = (equipment: string[]): string[] => {
      const { dictionaryItems, dictionaryMappings, equipmentOverlay, trashEquipment } = get();
      const uniqueNames = new Set<string>();

      equipment.forEach((value) => {
        // First, check if equipment is in trash - filter it out completely
        if (trashEquipment) {
          const codeUpper = value.toUpperCase();
          const underscoreVersion = codeUpper.replace(/[\s\-]/g, "_");
          const spaceVersion = codeUpper.replace(/[_\-]/g, " ");
          
          // Skip trash equipment
          if (
            trashEquipment.has(codeUpper) ||
            trashEquipment.has(underscoreVersion) ||
            trashEquipment.has(spaceVersion)
          ) {
            return; // Skip this equipment - it's in trash
          }
        }

        // Handle multi-mapping expansion: if value maps to multiple names, expand to all
        const mappedValue = equipmentOverlay.mappedCodes[value] || (() => {
          const codeUpper = value.toUpperCase();
          const underscoreVersion = codeUpper.replace(/[\s\-]/g, "_");
          return dictionaryMappings[codeUpper] || dictionaryMappings[underscoreVersion] || null;
        })();

        // If mappedValue is an array (multi-mapping), expand to all values
        if (Array.isArray(mappedValue)) {
          mappedValue.forEach((name) => {
            if (name && trashEquipment) {
              const nameUpper = name.toUpperCase();
              const nameUnderscore = nameUpper.replace(/[\s\-]/g, "_");
              const nameSpace = nameUpper.replace(/[_\-]/g, " ");
              
              if (
                !trashEquipment.has(nameUpper) &&
                !trashEquipment.has(nameUnderscore) &&
                !trashEquipment.has(nameSpace)
              ) {
                uniqueNames.add(name);
              }
            } else if (name) {
              uniqueNames.add(name);
            }
          });
          return; // Skip to next equipment value
        }

        // Single mapping (backward compatibility)
        let equipmentName: string | null = mappedValue;

        // 3. If not mapped, check if value is a code in dictionary - get name from dictionary
        if (!equipmentName) {
          const dictionaryItem = dictionaryItems[value];
          if (dictionaryItem) {
            equipmentName = dictionaryItem.name;
          } else {
            // 4. Check if value is already a name (exists in dictionary values)
            const existingItem = Object.values(dictionaryItems).find(
              (item) => item.name === value
            );
            if (existingItem) {
              equipmentName = value; // Already a name
            } else {
              // 5. Keep as-is (custom or unknown)
              equipmentName = value;
            }
          }
        }

        // Double-check: don't add if equipment name is in trash
        if (equipmentName && trashEquipment) {
          const nameUpper = equipmentName.toUpperCase();
          const nameUnderscore = nameUpper.replace(/[\s\-]/g, "_");
          const nameSpace = nameUpper.replace(/[_\-]/g, " ");
          
          if (
            trashEquipment.has(nameUpper) ||
            trashEquipment.has(nameUnderscore) ||
            trashEquipment.has(nameSpace)
          ) {
            return; // Skip - equipment name is in trash
          }
        }

        if (equipmentName) {
          uniqueNames.add(equipmentName);
        }
      });

      return Array.from(uniqueNames).sort();
    };

    // Add each file to ZIP
    // IMPORTANT: Must iterate in a way that ensures all files are processed
    const fileEntries = Array.from(state.files.entries());
    
    for (const [fileName, fileData] of fileEntries) {
      // Use state.workingJson for active file (may have unsaved changes),
      // otherwise use fileData.workingJson
      const isActiveFile = state.activeFileName === fileName;
      const jsonToExport = isActiveFile && state.workingJson 
        ? state.workingJson 
        : fileData.workingJson;

      // Convert equipment values to equipment names before export
      const exportedJson = {
        ...jsonToExport,
        equipment: jsonToExport.equipment 
          ? convertEquipmentToNames(jsonToExport.equipment)
          : [],
      };

      const jsonString = JSON.stringify(exportedJson, null, 2);

      // Determine ZIP path - ensure unique paths
      let zipPath: string;
      if (fileData.relativePath) {
        // Preserve folder structure, replace filename with listing-edited.json
        const pathParts = fileData.relativePath.split("/");
        if (pathParts.length > 1) {
          // Has folder structure
          pathParts[pathParts.length - 1] = "listing-edited.json";
          zipPath = pathParts.join("/");
        } else {
          // Just filename, but we still need unique paths - use full fileName
          const nameWithoutExt = fileName.replace(/\.json$/i, "");
          zipPath = `${nameWithoutExt}-edited.json`;
        }
      } else {
        // No relative path, use filename with -edited suffix
        // fileName should already be unique as it's the Map key
        const nameWithoutExt = fileName.replace(/\.json$/i, "");
        zipPath = `${nameWithoutExt}-edited.json`;
      }

      // Ensure path uniqueness - if collision detected, append index
      let finalPath = zipPath;
      let counter = 1;
      while (zip.files[finalPath]) {
        const nameWithoutExt = fileName.replace(/\.json$/i, "");
        finalPath = `${nameWithoutExt}-edited-${counter}.json`;
        counter++;
      }

      zip.file(finalPath, jsonString);
    }

    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "edited-json-files.zip");
  },

  exportAllAsDraft: async () => {
    const state = get();
    if (state.files.size === 0) return;

    // Dynamic import to avoid bundle size issues
    const JSZip = (await import("jszip")).default;
    const { saveAs } = await import("file-saver");

    const zip = new JSZip();

    // Helper function to convert equipment values to equipment names
    const convertEquipmentToNames = (equipment: string[]): string[] => {
      const { dictionaryItems, dictionaryMappings, equipmentOverlay, trashEquipment } = get();
      const uniqueNames = new Set<string>();

      equipment.forEach((value) => {
        // First, check if equipment is in trash - filter it out completely
        if (trashEquipment) {
          const codeUpper = value.toUpperCase();
          const underscoreVersion = codeUpper.replace(/[\s\-]/g, "_");
          const spaceVersion = codeUpper.replace(/[_\-]/g, " ");
          
          // Skip trash equipment
          if (
            trashEquipment.has(codeUpper) ||
            trashEquipment.has(underscoreVersion) ||
            trashEquipment.has(spaceVersion)
          ) {
            return; // Skip this equipment - it's in trash
          }
        }

        // Handle multi-mapping expansion: if value maps to multiple names, expand to all
        const mappedValue = equipmentOverlay.mappedCodes[value] || (() => {
          const codeUpper = value.toUpperCase();
          const underscoreVersion = codeUpper.replace(/[\s\-]/g, "_");
          return dictionaryMappings[codeUpper] || dictionaryMappings[underscoreVersion] || null;
        })();

        // If mappedValue is an array (multi-mapping), expand to all values
        if (Array.isArray(mappedValue)) {
          mappedValue.forEach((name) => {
            if (name && trashEquipment) {
              const nameUpper = name.toUpperCase();
              const nameUnderscore = nameUpper.replace(/[\s\-]/g, "_");
              const nameSpace = nameUpper.replace(/[_\-]/g, " ");
              
              if (
                !trashEquipment.has(nameUpper) &&
                !trashEquipment.has(nameUnderscore) &&
                !trashEquipment.has(nameSpace)
              ) {
                uniqueNames.add(name);
              }
            } else if (name) {
              uniqueNames.add(name);
            }
          });
          return; // Skip to next equipment value
        }

        // Single mapping (backward compatibility)
        let equipmentName: string | null = mappedValue;

        // 3. If not mapped, check if value is a code in dictionary - get name from dictionary
        if (!equipmentName) {
          const dictionaryItem = dictionaryItems[value];
          if (dictionaryItem) {
            equipmentName = dictionaryItem.name;
          } else {
            // 4. Check if value is already a name (exists in dictionary values)
            const existingItem = Object.values(dictionaryItems).find(
              (item) => item.name === value
            );
            if (existingItem) {
              equipmentName = value; // Already a name
            } else {
              // 5. Keep as-is (custom or unknown)
              equipmentName = value;
            }
          }
        }

        // Double-check: don't add if equipment name is in trash
        if (equipmentName && trashEquipment) {
          const nameUpper = equipmentName.toUpperCase();
          const nameUnderscore = nameUpper.replace(/[\s\-]/g, "_");
          const nameSpace = nameUpper.replace(/[_\-]/g, " ");
          
          if (
            trashEquipment.has(nameUpper) ||
            trashEquipment.has(nameUnderscore) ||
            trashEquipment.has(nameSpace)
          ) {
            return; // Skip - equipment name is in trash
          }
        }

        if (equipmentName) {
          uniqueNames.add(equipmentName);
        }
      });

      return Array.from(uniqueNames).sort();
    };

    // Build metadata object
    const metadata: {
      version: string;
      savedAt: string;
      files: Record<string, { isValidated: boolean; status: "green" | "yellow" | "red"; unknownCount?: number }>;
    } = {
      version: "1.0",
      savedAt: new Date().toISOString(),
      files: {},
    };

    // Add each file to ZIP
    const fileEntries = Array.from(state.files.entries());
    
    for (const [fileName, fileData] of fileEntries) {
      // Use state.workingJson for active file (may have unsaved changes),
      // otherwise use fileData.workingJson
      const isActiveFile = state.activeFileName === fileName;
      const jsonToExport = isActiveFile && state.workingJson 
        ? state.workingJson 
        : fileData.workingJson;

      // Convert equipment values to equipment names before export
      const exportedJson = {
        ...jsonToExport,
        equipment: jsonToExport.equipment 
          ? convertEquipmentToNames(jsonToExport.equipment)
          : [],
      };

      const jsonString = JSON.stringify(exportedJson, null, 2);

      // Determine ZIP path - preserve original filename
      let zipPath: string;
      if (fileData.relativePath) {
        // Preserve folder structure and original filename
        zipPath = fileData.relativePath;
      } else {
        // Use original filename
        zipPath = fileData.fileName;
      }

      // Ensure path uniqueness - if collision detected, append index
      let finalPath = zipPath;
      let counter = 1;
      while (zip.files[finalPath]) {
        const nameWithoutExt = fileData.fileName.replace(/\.json$/i, "");
        finalPath = `${nameWithoutExt}-${counter}.json`;
        counter++;
      }

      zip.file(finalPath, jsonString);

      // Add to metadata
      const unknownCount = fileData.unknownEquipment.length;
      const status: "green" | "yellow" | "red" = fileData.isValid 
        ? "green" 
        : unknownCount > 0 
          ? "yellow" 
          : "red";
      
      metadata.files[fileData.fileName] = {
        isValidated: fileData.isValid,
        status,
        unknownCount: unknownCount > 0 ? unknownCount : undefined,
      };
    }

    // Add metadata file to ZIP
    zip.file("draft-metadata.json", JSON.stringify(metadata, null, 2));

    // Generate and download ZIP
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "draft-progress.zip");
  },

  setDictionaryInfo: (
    version: string,
    fetchedAt: number,
    items: Record<string, EquipmentItem>,
    mappings?: Record<string, string | string[]>
  ) => {
    const state = get();
    
    // Update dictionary info
    set({
      dictionaryVersion: version,
      dictionaryFetchedAt: fetchedAt,
      dictionaryItems: items,
      dictionaryMappings: mappings || {},
    });

    // Convert equipment to names in all already-loaded files when dictionary becomes available
    // This handles the case where files were loaded before dictionary was ready
    // Also filters out trash equipment
    const newFilesMap = new Map(state.files);
    let hasUpdates = false;

    newFilesMap.forEach((fileData, mapKey) => {
      const equipmentArray = fileData.workingJson.equipment || [];
      const convertedEquipment = convertEquipmentToNames(
        equipmentArray,
        items,
        mappings || {},
        state.equipmentOverlay.mappedCodes,
        state.trashEquipment
      );

      // Only update if conversion changed anything (including trash filtering)
      if (JSON.stringify(equipmentArray.sort()) !== JSON.stringify(convertedEquipment.sort())) {
        const updatedJson = {
          ...fileData.workingJson,
          equipment: convertedEquipment,
        };

        newFilesMap.set(mapKey, {
          ...fileData,
          originalJson: {
            ...fileData.originalJson,
            equipment: convertedEquipment,
          },
          workingJson: updatedJson,
          originalHash: computeHash(updatedJson),
        });
        hasUpdates = true;
      }
    });

    // If we updated files and one is active, update active state too
    if (hasUpdates) {
      set({ files: newFilesMap });
      
      if (state.activeFileName) {
        const activeFileData = newFilesMap.get(state.activeFileName);
        if (activeFileData) {
          set({
            originalJson: activeFileData.originalJson,
            workingJson: activeFileData.workingJson,
            originalHash: activeFileData.originalHash,
          });
          // Re-validate equipment after conversion
          if (activeFileData.workingJson.equipment) {
            get().validateEquipment(activeFileData.workingJson.equipment);
          }
        }
      }
    }
  },

  setTrashEquipment: (trashSet: Set<string>) => {
    const state = get();
    set({ trashEquipment: trashSet });
    
    // Re-validate and filter equipment in all files when trash set is loaded
    // This handles the case where files were loaded before trash equipment was fetched
    if (state.files.size > 0) {
      const newFilesMap = new Map(state.files);
      let hasUpdates = false;

      newFilesMap.forEach((fileData, mapKey) => {
        const equipmentArray = fileData.workingJson.equipment || [];
        const filteredEquipment = equipmentArray.filter((code) => {
          const codeUpper = code.toUpperCase();
          const underscoreVersion = codeUpper.replace(/[\s\-]/g, "_");
          const spaceVersion = codeUpper.replace(/[_\-]/g, " ");
          
          // Keep equipment that is NOT in trash
          return !(
            trashSet.has(codeUpper) ||
            trashSet.has(underscoreVersion) ||
            trashSet.has(spaceVersion)
          );
        });

        // Update if trash equipment was filtered out
        if (filteredEquipment.length !== equipmentArray.length) {
          const updatedJson = {
            ...fileData.workingJson,
            equipment: filteredEquipment,
          };
          newFilesMap.set(mapKey, {
            ...fileData,
            workingJson: updatedJson,
          });
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        set({ files: newFilesMap });
        
        // Re-validate active file's equipment
        if (state.activeFileName && state.workingJson?.equipment) {
          const activeFileData = newFilesMap.get(state.activeFileName);
          if (activeFileData) {
            set({ workingJson: activeFileData.workingJson });
            get().validateEquipment(activeFileData.workingJson.equipment);
          }
        }
      } else if (state.activeFileName && state.workingJson?.equipment) {
        // Even if no files were updated, re-validate to update validation state
        get().validateEquipment(state.workingJson.equipment);
      }
    }
  },

  validateEquipment: (equipment: string[]) => {
    const state = get();
    const dictionary = state.dictionaryItems;
    const dictionaryMappings = state.dictionaryMappings;
    const overlay = state.equipmentOverlay;
    const trashEquipmentSet = state.trashEquipment;
    const validationState: Record<string, EquipmentValidationResult> = {};
    const unknownEquipment: string[] = [];
    
    // First, filter out trash equipment from the input array
    const nonTrashEquipment = equipment.filter((code) => {
      const codeUpper = code.toUpperCase();
      const underscoreVersion = codeUpper.replace(/[\s\-]/g, "_");
      const spaceVersion = codeUpper.replace(/[_\-]/g, " ");
      // Keep equipment that is NOT in trash
      // Check multiple formats: "4 DOORS", "4_DOORS", "4-DOORS" all should match trash set
      return !(
        overlay.trashedCodes.has(code) ||
        trashEquipmentSet.has(codeUpper) ||
        trashEquipmentSet.has(underscoreVersion) ||
        trashEquipmentSet.has(spaceVersion)
      );
    });

    // Validate only non-trash equipment
    for (const code of nonTrashEquipment) {
      // Preserve custom status if already set
      const existingStatus = state.validationState[code]?.status;
      if (existingStatus === "custom") {
        validationState[code] = {
          code,
          status: "custom",
        };
        continue;
      }

      // 2. Check if code is mapped to another code (session overlay)
      if (overlay.mappedCodes[code]) {
        const mappedName = overlay.mappedCodes[code]; // This is an equipment NAME, not code
        // Check if mapped name exists in dictionary (search by name in values)
        // dictionary is indexed by code, so we need to search values
        const equipmentExists = Object.values(dictionary).some(
          (item) => item.name === mappedName
        );
        if (equipmentExists || overlay.addedCodes.has(mappedName)) {
          validationState[code] = {
            code,
            status: "valid",
          };
          continue;
        }
      }

      // 3. Check if code was added to database in this session
      if (overlay.addedCodes.has(code)) {
        validationState[code] = {
          code,
          status: "valid",
        };
        continue;
      }

      // 4. Check dictionary mappings (from database)
      // Dictionary mappings now map to equipment name (not code)
      // Normalize code to uppercase for lookup (handles both "12-VOLT SOCKET" and "12_VOLT_SOCKET")
      const codeUpper2 = code.toUpperCase();
      const underscoreVersion2 = codeUpper2.replace(/[\s\-]/g, "_");
      
      const mappedEquipmentName = dictionaryMappings[codeUpper2] || dictionaryMappings[underscoreVersion2];
      if (mappedEquipmentName) {
        // Check if equipment name exists in dictionary (search by name in values)
        // dictionary is indexed by code, so we need to search values
        const equipmentExists = Object.values(dictionary).some(
          (item) => item.name === mappedEquipmentName
        );
        if (equipmentExists) {
          validationState[code] = {
            code,
            status: "valid",
          };
          continue;
        }
      }

      // 5. Fall back to dictionary lookup
      // Check both by code (if code is used) and by name
      if (dictionary[code]) {
        validationState[code] = {
          code,
          status: "valid",
        };
      } else {
        // Also check if code matches an equipment name
        const equipmentByName = Object.values(dictionary).find(
          (item) => item.name === code
        );
        if (equipmentByName) {
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
    }

    // If trash equipment was filtered out, update the workingJson
    if (nonTrashEquipment.length !== equipment.length && state.workingJson) {
      const updatedJson = {
        ...state.workingJson,
        equipment: nonTrashEquipment,
      };
      set({ workingJson: updatedJson });
      
      // Also update in file map if active file exists
      if (state.activeFileName) {
        const fileData = state.files.get(state.activeFileName);
        if (fileData) {
          const newFilesMap = new Map(state.files);
          newFilesMap.set(state.activeFileName, {
            ...fileData,
            workingJson: updatedJson,
          });
          set({ files: newFilesMap });
        }
      }
    }

    set({
      validationState,
      unknownEquipment,
    });

    // Update file data in map if active file exists (but DON'T automatically set isValid)
    // isValid should only be set when user clicks "Save" via markFileAsValid
    if (state.activeFileName) {
      const fileData = state.files.get(state.activeFileName);
      if (fileData) {
        // Update validation state but preserve existing isValid (don't auto-set it)
        const newFilesMap = new Map(state.files);
        newFilesMap.set(state.activeFileName, {
          ...fileData,
          validationState,
          unknownEquipment,
          // Don't change isValid here - only markFileAsValid should set it to true
        });
        set({ files: newFilesMap });
      }
    }
  },

  // Equipment overlay actions (for CRUD tracking)
  recordEquipmentMapping: (rawCode: string, canonicalCode: string | string[]) => {
    const state = get();
    const overlay = state.equipmentOverlay;
    
    // Store mapping (can be string or string[])
    set({
      equipmentOverlay: {
        ...overlay,
        mappedCodes: {
          ...overlay.mappedCodes,
          [rawCode]: canonicalCode,
        },
      },
    });
    
    // Expand to array if it's a single string
    const canonicalCodes = Array.isArray(canonicalCode) ? canonicalCode : [canonicalCode];
    
    // Apply mapping to ALL files in the session (not just active file)
    const newFilesMap = new Map(state.files);
    let hasUpdates = false;

    newFilesMap.forEach((fileData, mapKey) => {
      const equipmentArray = fileData.workingJson.equipment || [];
      // If this file contains the rawCode, replace it with all canonicalCodes (expansion)
      if (equipmentArray.includes(rawCode)) {
        // Replace rawCode with all canonical codes (multi-mapping expansion)
        const updatedEquipment = equipmentArray.flatMap((code) =>
          code === rawCode ? canonicalCodes : [code]
        );
        // Remove duplicates
        const uniqueEquipment = Array.from(new Set(updatedEquipment));
        
        const updatedJson = {
          ...fileData.workingJson,
          equipment: uniqueEquipment,
        };

        newFilesMap.set(mapKey, {
          ...fileData,
          workingJson: updatedJson,
        });
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      set({ files: newFilesMap });
      
      // Update active file's state if it was modified
      if (state.activeFileName) {
        const activeFileData = newFilesMap.get(state.activeFileName);
        if (activeFileData && state.workingJson?.equipment) {
          const activeEquipment = activeFileData.workingJson.equipment || [];
          set({ workingJson: { ...state.workingJson, equipment: activeEquipment } });
          get().validateEquipment(activeEquipment);
        }
      }
    } else {
      // Re-validate current file's equipment to reflect mapping
      if (state.activeFileName && state.workingJson?.equipment) {
        get().validateEquipment(state.workingJson.equipment);
      }
    }
  },

  recordEquipmentAdded: (code: string) => {
    const state = get();
    const overlay = state.equipmentOverlay;
    const newAddedCodes = new Set(overlay.addedCodes);
    newAddedCodes.add(code);
    set({
      equipmentOverlay: {
        ...overlay,
        addedCodes: newAddedCodes,
      },
    });
    // Re-validate current file's equipment to reflect addition
    if (state.activeFileName && state.workingJson?.equipment) {
      get().validateEquipment(state.workingJson.equipment);
    }
  },

  recordEquipmentTrashed: (code: string) => {
    const state = get();
    const overlay = state.equipmentOverlay;
    const newTrashedCodes = new Set(overlay.trashedCodes);
    newTrashedCodes.add(code);
    set({
      equipmentOverlay: {
        ...overlay,
        trashedCodes: newTrashedCodes,
      },
    });
    
    // Remove trashed equipment from ALL files in the session (not just active file)
    const newFilesMap = new Map(state.files);
    let hasUpdates = false;

    newFilesMap.forEach((fileData, mapKey) => {
      const equipmentArray = fileData.workingJson.equipment || [];
      // If this file contains the trashed code, remove it
      if (equipmentArray.includes(code)) {
        const updatedEquipment = equipmentArray.filter((c) => c !== code);
        
        const updatedJson = {
          ...fileData.workingJson,
          equipment: updatedEquipment,
        };

        newFilesMap.set(mapKey, {
          ...fileData,
          workingJson: updatedJson,
        });
        hasUpdates = true;
      }
    });

    if (hasUpdates) {
      set({ files: newFilesMap });
      
      // Update active file's state if it was modified
      if (state.activeFileName) {
        const activeFileData = newFilesMap.get(state.activeFileName);
        if (activeFileData && state.workingJson?.equipment) {
          const activeEquipment = activeFileData.workingJson.equipment || [];
          set({ workingJson: { ...state.workingJson, equipment: activeEquipment } });
          get().validateEquipment(activeEquipment);
        }
      }
    } else {
      // Re-validate current file's equipment to reflect trash status
      if (state.activeFileName && state.workingJson?.equipment) {
        get().validateEquipment(state.workingJson.equipment);
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

  isFileValid: (fileName: string) => {
    const state = get();
    const fileData = state.files.get(fileName);
    if (!fileData) return false;
    return fileData.isValid;
  },

  areAllFilesValid: () => {
    const state = get();
    if (state.files.size === 0) return false;
    
    for (const fileData of state.files.values()) {
      if (!fileData.isValid) {
        return false;
      }
    }
    return true;
  },
}));
