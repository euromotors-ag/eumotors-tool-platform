/**
 * Equipment Changes Manager
 * Handles local storage of pending equipment changes with performance optimizations:
 * - Debounced writes to sessionStorage (batches multiple writes)
 * - In-memory cache for instant reads
 * - Compact data format to minimize storage
 */

// Compact interface for equipment changes (minimized keys for storage efficiency)
interface EquipmentChange {
  id: string; // Short ID: timestamp + random
  t: "A" | "M" | "T"; // Type: ADD, MAP, TRASH (1 byte instead of string)
  r: string; // rawValue
  v?: string | string[]; // targetValue
  e?: string; // equipmentId (optional)
  n?: string; // equipmentName (optional)
  ts: number; // timestamp
}

interface PendingChanges {
  f: string; // fileName (short key)
  c: EquipmentChange[]; // changes (short key)
}

// In-memory cache for fast access (avoids sessionStorage reads)
const pendingChangesCache: Map<string, EquipmentChange[]> = new Map();

// Debounce timer for batching sessionStorage writes
let writeDebounceTimer: number | null = null;
const DEBOUNCE_DELAY_MS = 100;

// Storage key prefix
const STORAGE_KEY_PREFIX = "equipment-pending-";

/**
 * Get storage key for a file
 */
function getStorageKey(fileName: string): string {
  return `${STORAGE_KEY_PREFIX}${fileName}`;
}

/**
 * Write pending changes to sessionStorage (debounced)
 */
function flushToStorage(): void {
  if (writeDebounceTimer !== null) {
    clearTimeout(writeDebounceTimer);
    writeDebounceTimer = null;
  }

  try {
    // Write all cached changes to sessionStorage
    pendingChangesCache.forEach((changes, fileName) => {
      const storageKey = getStorageKey(fileName);
      if (changes.length === 0) {
        // Remove from storage if no changes
        sessionStorage.removeItem(storageKey);
      } else {
        // Serialize and store
        const data: PendingChanges = {
          f: fileName,
          c: changes,
        };
        sessionStorage.setItem(storageKey, JSON.stringify(data));
      }
    });
  } catch (error) {
    console.error("Failed to write pending changes to sessionStorage:", error);
    // If storage is full, try to clear old entries
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.warn("SessionStorage quota exceeded, clearing old entries");
      clearAllPendingChanges();
    }
  }
}

/**
 * Schedule a debounced write to sessionStorage
 */
function scheduleWrite(): void {
  if (writeDebounceTimer !== null) {
    clearTimeout(writeDebounceTimer);
  }

  writeDebounceTimer = window.setTimeout(() => {
    flushToStorage();
    writeDebounceTimer = null;
  }, DEBOUNCE_DELAY_MS);
}

/**
 * Convert full change object to compact format
 */
function toCompactChange(
  change: {
    id: string;
    type: "ADD" | "MAP" | "TRASH";
    rawValue: string;
    targetValue?: string | string[];
    equipmentId?: string;
    equipmentName?: string;
    timestamp: number;
  }
): EquipmentChange {
  const typeMap: Record<"ADD" | "MAP" | "TRASH", "A" | "M" | "T"> = {
    ADD: "A",
    MAP: "M",
    TRASH: "T",
  };

  return {
    id: change.id,
    t: typeMap[change.type],
    r: change.rawValue,
    v: change.targetValue,
    e: change.equipmentId,
    n: change.equipmentName,
    ts: change.timestamp,
  };
}

/**
 * Convert compact change back to full format
 */
function fromCompactChange(change: EquipmentChange): {
  id: string;
  type: "ADD" | "MAP" | "TRASH";
  rawValue: string;
  targetValue?: string | string[];
  equipmentId?: string;
  equipmentName?: string;
  timestamp: number;
} {
  const typeMap: Record<"A" | "M" | "T", "ADD" | "MAP" | "TRASH"> = {
    A: "ADD",
    M: "MAP",
    T: "TRASH",
  };

  return {
    id: change.id,
    type: typeMap[change.t],
    rawValue: change.r,
    targetValue: change.v,
    equipmentId: change.e,
    equipmentName: change.n,
    timestamp: change.ts,
  };
}

/**
 * Save a change to sessionStorage (debounced) and cache
 */
export function saveChange(
  fileName: string,
  change: {
    id: string;
    type: "ADD" | "MAP" | "TRASH";
    rawValue: string;
    targetValue?: string | string[];
    equipmentId?: string;
    equipmentName?: string;
    timestamp: number;
  }
): void {
  // Get or create changes array for this file
  let changes = pendingChangesCache.get(fileName) || [];

  // Convert to compact format
  const compactChange = toCompactChange(change);

  // Add to changes array
  changes = [...changes, compactChange];

  // Update cache
  pendingChangesCache.set(fileName, changes);

  // Schedule debounced write
  scheduleWrite();
}

/**
 * Get all pending changes for a file (from cache or sessionStorage)
 */
export function getPendingChanges(fileName: string): Array<{
  id: string;
  type: "ADD" | "MAP" | "TRASH";
  rawValue: string;
  targetValue?: string | string[];
  equipmentId?: string;
  equipmentName?: string;
  timestamp: number;
}> {
  // Try cache first (fastest)
  const cached = pendingChangesCache.get(fileName);
  if (cached) {
    return cached.map(fromCompactChange);
  }

  // Fallback to sessionStorage
  try {
    const storageKey = getStorageKey(fileName);
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      const data: PendingChanges = JSON.parse(stored);
      const changes = data.c || [];
      // Update cache for future reads
      pendingChangesCache.set(fileName, changes);
      return changes.map(fromCompactChange);
    }
  } catch (error) {
    console.error("Failed to read pending changes from sessionStorage:", error);
  }

  return [];
}

/**
 * Remove a change (for undo)
 */
export function removeChange(fileName: string, changeId: string): void {
  let changes = pendingChangesCache.get(fileName) || [];

  // Remove change with matching ID
  changes = changes.filter((c) => c.id !== changeId);

  // Update cache
  if (changes.length === 0) {
    pendingChangesCache.delete(fileName);
  } else {
    pendingChangesCache.set(fileName, changes);
  }

  // Schedule debounced write
  scheduleWrite();
}

/**
 * Clear all pending changes for a file
 */
export function clearPendingChanges(fileName: string): void {
  // Remove from cache
  pendingChangesCache.delete(fileName);

  // Remove from storage
  try {
    const storageKey = getStorageKey(fileName);
    sessionStorage.removeItem(storageKey);
  } catch (error) {
    console.error("Failed to clear pending changes from sessionStorage:", error);
  }
}

/**
 * Get all pending changes for all files
 */
export function getAllPendingChanges(): Map<
  string,
  Array<{
    id: string;
    type: "ADD" | "MAP" | "TRASH";
    rawValue: string;
    targetValue?: string | string[];
    equipmentId?: string;
    equipmentName?: string;
    timestamp: number;
  }>
> {
  const result = new Map<
    string,
    Array<{
      id: string;
      type: "ADD" | "MAP" | "TRASH";
      rawValue: string;
      targetValue?: string | string[];
      equipmentId?: string;
      equipmentName?: string;
      timestamp: number;
    }>
  >();

  // Load all from sessionStorage if cache is incomplete
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const fileName = key.substring(STORAGE_KEY_PREFIX.length);
        const changes = getPendingChanges(fileName);
        if (changes.length > 0) {
          result.set(fileName, changes);
        }
      }
    }
  } catch (error) {
    console.error("Failed to get all pending changes:", error);
  }

  // Also include cached changes that might not be in storage yet
  pendingChangesCache.forEach((changes, fileName) => {
    if (!result.has(fileName) && changes.length > 0) {
      result.set(fileName, changes.map(fromCompactChange));
    }
  });

  return result;
}

/**
 * Force flush all pending writes to sessionStorage (for Save button)
 */
export function flushPendingWrites(): void {
  if (writeDebounceTimer !== null) {
    clearTimeout(writeDebounceTimer);
    writeDebounceTimer = null;
  }
  flushToStorage();
}

/**
 * Clear all pending changes (for cleanup)
 */
export function clearAllPendingChanges(): void {
  // Clear cache
  pendingChangesCache.clear();

  // Clear storage
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch (error) {
    console.error("Failed to clear all pending changes:", error);
  }
}

/**
 * Initialize cache from sessionStorage (call on app load)
 */
export function initializeCache(): void {
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(STORAGE_KEY_PREFIX)) {
        const fileName = key.substring(STORAGE_KEY_PREFIX.length);
        const stored = sessionStorage.getItem(key);
        if (stored) {
          try {
            const data: PendingChanges = JSON.parse(stored);
            if (data.c && Array.isArray(data.c)) {
              pendingChangesCache.set(fileName, data.c);
            }
          } catch (parseError) {
            console.error(`Failed to parse pending changes for ${fileName}:`, parseError);
          }
        }
      }
    }
  } catch (error) {
    console.error("Failed to initialize pending changes cache:", error);
  }
}
