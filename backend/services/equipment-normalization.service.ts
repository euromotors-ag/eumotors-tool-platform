import { prisma } from "../lib/prisma.js";
import { EquipmentBin } from "@prisma/client";

/**
 * Equipment Status Types
 */
export type EquipmentStatus = "GREEN" | "YELLOW" | "RED";

/**
 * Normalized Equipment Item
 */
export interface NormalizedEquipmentItem {
  rawValue: string;
  status: EquipmentStatus;
  canonicalCode?: string; // Filled if GREEN
  canonicalLabel?: string; // From Equipment.name
  equipmentId?: string; // Database ID of canonical equipment
}

/**
 * Normalization Result
 */
export interface NormalizeEquipmentResult {
  green: NormalizedEquipmentItem[];
  yellow: NormalizedEquipmentItem[];
  red: NormalizedEquipmentItem[];
}

/**
 * Equipment Normalization Service
 * 
 * Handles the normalization of raw equipment strings into canonical equipment codes.
 * This is the core engine for the equipment validation & normalization layer.
 */
export class EquipmentNormalizationService {
  /**
   * Normalize a list of raw equipment values
   * 
   * Logic per raw value:
   * 1) If raw_value exists in equipment_trash → status = RED
   * 2) Else if a canonical match exists in equipment_standard (by label or code) → status = GREEN
   * 3) Else if a mapping exists in equipment_mapping (source_system + raw_value) → resolve normalized_id and mark GREEN
   * 4) Else → status = YELLOW (unknown, needs human decision)
   * 
   * @param rawValues Array of raw equipment strings from source
   * @param sourceSystem Source system identifier (e.g., "pdf", "blocket", "mobile", "manual")
   * @param carId Optional car ID (currently unused, kept for future use)
   * @param insertAuditTrail Whether to insert records into raw_car_equipment for audit (currently unused)
   */
  async normalizeEquipment(
    rawValues: string[],
    sourceSystem: string,
    carId?: string,
    insertAuditTrail: boolean = false
  ): Promise<NormalizeEquipmentResult> {
    const normalized: NormalizedEquipmentItem[] = [];
    const upperRawValues = rawValues.map((v) => v.toUpperCase().trim()).filter((v) => v.length > 0);

    // Step 1: Check trash equipment
    const trashEquipment = await prisma.equipment.findMany({
      where: { binCategory: "bin_trash" },
      select: { name: true },
    });
    const trashSet = new Set(trashEquipment.map((e) => e.name.toUpperCase()));

    // Step 2: Get all canonical (good) equipment
    const canonicalEquipment = await prisma.equipment.findMany({
      where: { binCategory: "bin_good" },
      select: { id: true, name: true, code: true },
    });
    const canonicalByName = new Map<string, typeof canonicalEquipment[0]>();
    const canonicalByCode = new Map<string, typeof canonicalEquipment[0]>();

    for (const eq of canonicalEquipment) {
      canonicalByName.set(eq.name.toUpperCase(), eq);
      if (eq.code) {
        canonicalByCode.set(eq.code.toUpperCase(), eq);
      }
    }

    // Step 3: Get existing mappings for this source system
    const mappings = await prisma.equipmentMapping.findMany({
      where: {
        sourceSystem,
        rawValue: { in: upperRawValues },
      },
      include: {
        equipment: {
          select: { id: true, name: true, code: true },
        },
      },
    });
    const mappingMap = new Map<string, typeof mappings[0]>();
    for (const mapping of mappings) {
      mappingMap.set(mapping.rawValue.toUpperCase(), mapping);
    }

    // Process each raw value
    for (const rawValue of upperRawValues) {
      let item: NormalizedEquipmentItem = {
        rawValue,
        status: "YELLOW",
      };

      // Check trash first
      if (trashSet.has(rawValue)) {
        item.status = "RED";
      }
      // Check canonical by name
      else if (canonicalByName.has(rawValue)) {
        const eq = canonicalByName.get(rawValue)!;
        item.status = "GREEN";
        item.canonicalCode = eq.code || undefined;
        item.canonicalLabel = eq.name;
        item.equipmentId = eq.id;
      }
      // Check canonical by code (if raw value matches a code)
      else if (canonicalByCode.has(rawValue)) {
        const eq = canonicalByCode.get(rawValue)!;
        item.status = "GREEN";
        item.canonicalCode = eq.code || undefined;
        item.canonicalLabel = eq.name;
        item.equipmentId = eq.id;
      }
      // Check mapping
      else if (mappingMap.has(rawValue)) {
        const mapping = mappingMap.get(rawValue)!;
        item.status = "GREEN";
        item.canonicalCode = mapping.equipment.code || undefined;
        item.canonicalLabel = mapping.equipment.name;
        item.equipmentId = mapping.equipment.id;
      }

      normalized.push(item);
    }

    // Group by status
    const result: NormalizeEquipmentResult = {
      green: normalized.filter((item) => item.status === "GREEN"),
      yellow: normalized.filter((item) => item.status === "YELLOW"),
      red: normalized.filter((item) => item.status === "RED"),
    };

    return result;
  }

  /**
   * Generate canonical code from label
   * Converts "Air Conditioning" -> "AIR_CONDITIONING"
   */
  generateCanonicalCode(label: string): string {
    return label
      .toUpperCase()
      .trim()
      .replace(/[^A-Z0-9]+/g, "_") // Replace non-alphanumeric with underscore
      .replace(/^_+|_+$/g, "") // Remove leading/trailing underscores
      .replace(/_+/g, "_"); // Replace multiple underscores with single
  }
}

export const equipmentNormalizationService = new EquipmentNormalizationService();
