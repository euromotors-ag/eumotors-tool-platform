import { NormalizeEquipmentResult } from "../services/equipment-normalization.service.js";

/**
 * Car JSON Builder Utility
 * 
 * Transforms raw car JSON with equipment normalization results
 * into a clean car JSON ready for upload to Supabase.
 */

export interface RawCarJson {
  [key: string]: any;
  equipment?: string[]; // Raw equipment strings
}

export interface CleanCarJson {
  [key: string]: any;
  equipment: string[]; // Canonical equipment codes
}

/**
 * Build clean car JSON from raw car JSON and normalization result
 * 
 * @param rawCarJson Original car JSON with raw equipment strings
 * @param normalizationResult Result from normalizeEquipment
 * @returns Clean car JSON with canonical equipment codes
 */
export function buildCleanCarJson(
  rawCarJson: RawCarJson,
  normalizationResult: NormalizeEquipmentResult
): CleanCarJson {
  // Extract only GREEN (canonical) equipment codes
  const canonicalCodes = normalizationResult.green
    .map((item) => item.canonicalCode)
    .filter((code): code is string => code !== undefined);

  // Build clean JSON
  const cleanJson: CleanCarJson = {
    ...rawCarJson,
    equipment: canonicalCodes,
  };

  return cleanJson;
}

/**
 * Build car equipment relations for database persistence
 * 
 * @param carId Car ID
 * @param normalizationResult Result from normalizeEquipment
 * @returns Array of car-equipment relation objects
 */
export function buildCarEquipmentRelations(
  carId: string,
  normalizationResult: NormalizeEquipmentResult
): Array<{ carId: string; equipmentId: string }> {
  return normalizationResult.green
    .filter((item) => item.equipmentId !== undefined)
    .map((item) => ({
      carId,
      equipmentId: item.equipmentId!,
    }));
}
