/**
 * Reference data types for equipment dictionary
 */

export interface EquipmentItem {
  id: string;
  code: string; // Canonical code (UPPER_SNAKE_CASE)
  name: string; // Human-readable label
  category?: string; // Optional category
  binCategory?: "bin_good" | "bin_trash";
}

export interface EquipmentDictionarySnapshot {
  version: string; // Timestamp or version identifier
  checksum: string; // MD5 or SHA256 hash of the dictionary
  itemsByCode: Record<string, EquipmentItem>; // O(1) lookup by code
  fetchedAt: number; // Unix timestamp
}

export interface EquipmentReferenceResponse {
  version: string;
  checksum: string;
  itemsByCode: Record<string, EquipmentItem>;
  fetchedAt: number;
  stale?: boolean; // Flag if serving stale cache due to Supabase unavailability
}
