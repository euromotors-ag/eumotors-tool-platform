import { prisma } from "../lib/prisma.js";
import {
  NormalizedEquipmentItem,
  equipmentNormalizationService,
} from "./equipment-normalization.service.js";
import { invalidateEquipmentDictionaryCache } from "./reference.service.js";

/**
 * Equipment Admin Service
 * 
 * Handles admin actions for equipment normalization:
 * - Approve unknown as new canonical equipment
 * - Map unknown raw_value to existing canonical equipment
 * - Mark raw_value as trash
 */
export class EquipmentAdminService {
  /**
   * Approve unknown equipment as new canonical equipment
   * 
   * @param rawValue The raw equipment value to approve
   * @param sourceSystem Source system identifier
   * @param category Optional functional category
   * @param code Optional canonical code (auto-generated if not provided)
   * @param createdBy Optional user identifier
   */
  async approveAsNewCanonical(
    rawValue: string,
    sourceSystem: string,
    category?: string,
    code?: string,
    createdBy?: string
  ): Promise<NormalizedEquipmentItem> {
    const upperRawValue = rawValue.toUpperCase().trim();

    // Generate code if not provided
    const canonicalCode =
      code?.toUpperCase().trim() ||
      equipmentNormalizationService.generateCanonicalCode(rawValue);

    // Check if equipment with this code already exists
    const existing = await prisma.equipment.findFirst({
      where: {
        OR: [
          { code: canonicalCode },
          { name: upperRawValue },
        ],
      },
    });

    if (existing) {
      // If exists, create mapping and return
      await prisma.equipmentMapping.upsert({
        where: {
          sourceSystem_rawValue: {
            sourceSystem,
            rawValue: upperRawValue,
          },
        },
        update: {
          equipmentId: existing.id,
          updatedAt: new Date(),
        },
        create: {
          sourceSystem,
          rawValue: upperRawValue,
          equipmentId: existing.id,
          createdBy: createdBy || null,
        },
      });

      // Invalidate dictionary cache to ensure fresh data on next request
      invalidateEquipmentDictionaryCache();

      return {
        rawValue: upperRawValue,
        status: "GREEN",
        canonicalCode: existing.code || undefined,
        canonicalLabel: existing.name,
        equipmentId: existing.id,
      };
    }

    // Create new canonical equipment
    const equipment = await prisma.equipment.create({
      data: {
        name: upperRawValue,
        binCategory: "bin_good",
        category: category || null,
        code: canonicalCode,
        source: sourceSystem,
        createdBy: createdBy || null,
      },
    });

    // Create mapping
    await prisma.equipmentMapping.create({
      data: {
        sourceSystem,
        rawValue: upperRawValue,
        equipmentId: equipment.id,
        createdBy: createdBy || null,
      },
    });

    // Invalidate dictionary cache to ensure fresh data on next request
    invalidateEquipmentDictionaryCache();

    return {
      rawValue: upperRawValue,
      status: "GREEN",
      canonicalCode: equipment.code || undefined,
      canonicalLabel: equipment.name,
      equipmentId: equipment.id,
    };
  }

  /**
   * Map unknown raw_value to existing canonical equipment
   * Supports both single and multi-mapping
   * 
   * @param rawValue The raw equipment value to map
   * @param sourceSystem Source system identifier
   * @param targetEquipmentId The ID of the canonical equipment to map to (for single mapping)
   * @param targetEquipmentIds Array of equipment IDs for multi-mapping (takes precedence over targetEquipmentId)
   * @param createdBy Optional user identifier
   */
  async mapToExistingCanonical(
    rawValue: string,
    sourceSystem: string,
    targetEquipmentId: string,
    createdBy?: string,
    targetEquipmentIds?: string[]
  ): Promise<NormalizedEquipmentItem> {
    const upperRawValue = rawValue.toUpperCase().trim();

    // Use targetEquipmentIds if provided, otherwise use single targetEquipmentId
    const equipmentIdsToMap = targetEquipmentIds && targetEquipmentIds.length > 0
      ? targetEquipmentIds
      : [targetEquipmentId];

    // Verify all target equipment exist and are canonical (bin_good)
    const targetEquipmentList = await prisma.equipment.findMany({
      where: {
        id: { in: equipmentIdsToMap },
        binCategory: "bin_good",
      },
      select: { id: true, name: true, code: true },
    });

    if (targetEquipmentList.length !== equipmentIdsToMap.length) {
      const foundIds = targetEquipmentList.map(e => e.id);
      const missingIds = equipmentIdsToMap.filter(id => !foundIds.includes(id));
      throw new Error(
        `Some canonical equipment not found or not in bin_good: ${missingIds.join(", ")}`
      );
    }

    // For multi-mapping, use equipmentIds JSONB column
    // For single mapping (backward compatibility), use equipmentId column
    const isMultiMapping = equipmentIdsToMap.length > 1;

    // Create or update mapping
    // Use raw SQL for multi-mapping to handle JSONB properly
    if (isMultiMapping) {
      // Multi-mapping: use equipmentIds JSONB, set equipmentId to null
      await prisma.$executeRawUnsafe(`
        INSERT INTO "EquipmentMapping" ("id", "sourceSystem", "rawValue", "equipment_id", "equipmentIds", "created_at", "updated_at", "created_by")
        VALUES (gen_random_uuid(), $1, $2, NULL, $3::jsonb, NOW(), NOW(), $4)
        ON CONFLICT ("sourceSystem", "rawValue")
        DO UPDATE SET
          "equipment_id" = NULL,
          "equipmentIds" = $3::jsonb,
          "updated_at" = NOW()
      `, sourceSystem, upperRawValue, JSON.stringify(equipmentIdsToMap), createdBy || null);
    } else {
      // Single mapping: use equipmentId (backward compatibility)
      // Use raw SQL to ensure equipmentIds is set to null
      await prisma.$executeRawUnsafe(`
        INSERT INTO "EquipmentMapping" ("id", "sourceSystem", "rawValue", "equipment_id", "equipmentIds", "created_at", "updated_at", "created_by")
        VALUES (gen_random_uuid(), $1, $2, $3, NULL, NOW(), NOW(), $4)
        ON CONFLICT ("sourceSystem", "rawValue")
        DO UPDATE SET
          "equipment_id" = $3,
          "equipmentIds" = NULL,
          "updated_at" = NOW()
      `, sourceSystem, upperRawValue, equipmentIdsToMap[0], createdBy || null);
    }

    // Invalidate dictionary cache to ensure fresh data on next request
    invalidateEquipmentDictionaryCache();

    // Return the first equipment item (for backward compatibility)
    // Frontend will handle expansion to all items
    const firstEquipment = targetEquipmentList[0];
    return {
      rawValue: upperRawValue,
      status: "GREEN",
      canonicalCode: firstEquipment.code || undefined,
      canonicalLabel: firstEquipment.name,
      equipmentId: firstEquipment.id,
    };
  }

  /**
   * Mark raw_value as trash
   * 
   * @param rawValue The raw equipment value to mark as trash
   * @param sourceSystem Optional source system identifier
   * @param reason Optional reason for marking as trash
   * @param createdBy Optional user identifier
   */
  async markAsTrash(
    rawValue: string,
    sourceSystem?: string,
    reason?: string,
    createdBy?: string
  ): Promise<NormalizedEquipmentItem> {
    const upperRawValue = rawValue.toUpperCase().trim();

    // Check if already exists as trash
    const existingTrash = await prisma.equipment.findFirst({
      where: {
        name: upperRawValue,
        binCategory: "bin_trash",
      },
    });

    if (existingTrash) {
      return {
        rawValue: upperRawValue,
        status: "RED",
      };
    }

    // Check if exists as good equipment - if so, move to trash
    const existingGood = await prisma.equipment.findFirst({
      where: {
        name: upperRawValue,
        binCategory: "bin_good",
      },
    });

    if (existingGood) {
      // Update to trash
      await prisma.equipment.update({
        where: { id: existingGood.id },
        data: {
          binCategory: "bin_trash",
          updatedAt: new Date(),
        },
      });

      // Delete any mappings to this equipment
      await prisma.equipmentMapping.deleteMany({
        where: { equipmentId: existingGood.id },
      });

      // Invalidate dictionary cache to ensure fresh data on next request
      invalidateEquipmentDictionaryCache();

      return {
        rawValue: upperRawValue,
        status: "RED",
      };
    }

    // Create new trash entry
    await prisma.equipment.create({
      data: {
        name: upperRawValue,
        binCategory: "bin_trash",
        source: sourceSystem || "manual",
        createdBy: createdBy || null,
      },
    });

    // Invalidate dictionary cache to ensure fresh data on next request
    invalidateEquipmentDictionaryCache();

    return {
      rawValue: upperRawValue,
      status: "RED",
    };
  }

  /**
   * Get all canonical equipment (for dropdowns, filters, etc.)
   */
  async getAllCanonicalEquipment() {
    return prisma.equipment.findMany({
      where: { binCategory: "bin_good" },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
      },
      orderBy: { name: "asc" },
    });
  }
}

export const equipmentAdminService = new EquipmentAdminService();
