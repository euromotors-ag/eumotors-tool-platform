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
      // Equipment already exists - just return it (no mapping needed for ADD)
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
    // NOTE: ADD does NOT create a mapping - only MAP actions create mappings
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

  /**
   * Delete a mapping (undo mapping action)
   * 
   * @param rawValue The raw equipment value to unmap
   * @param sourceSystem Source system identifier
   */
  async deleteMapping(
    rawValue: string,
    sourceSystem: string
  ): Promise<void> {
    const upperRawValue = rawValue.toUpperCase().trim();

    await prisma.equipmentMapping.deleteMany({
      where: {
        sourceSystem,
        rawValue: upperRawValue,
      },
    });

    // Invalidate dictionary cache to ensure fresh data on next request
    invalidateEquipmentDictionaryCache();
  }

  /**
   * Restore equipment from trash (undo trash action)
   * 
   * @param rawValue The raw equipment value to restore
   */
  async restoreFromTrash(rawValue: string): Promise<void> {
    const upperRawValue = rawValue.toUpperCase().trim();

    // Find equipment in trash
    const trashEquipment = await prisma.equipment.findFirst({
      where: {
        name: upperRawValue,
        binCategory: "bin_trash",
      },
    });

    if (trashEquipment) {
      // Restore to bin_good
      await prisma.equipment.update({
        where: { id: trashEquipment.id },
        data: {
          binCategory: "bin_good",
          updatedAt: new Date(),
        },
      });

      // Invalidate dictionary cache to ensure fresh data on next request
      invalidateEquipmentDictionaryCache();
    }
  }

  /**
   * Batch sync equipment changes (ADD, MAP, TRASH)
   * Uses Prisma transaction for atomicity and processes changes efficiently
   * 
   * @param changes Array of equipment changes to sync
   * @param sourceSystem Source system identifier
   * @param createdBy Optional user identifier
   */
  async batchSyncEquipment(
    changes: Array<{
      id: string;
      type: "ADD" | "MAP" | "TRASH";
      rawValue: string;
      targetValue?: string | string[];
      equipmentId?: string;
      equipmentName?: string;
    }>,
    sourceSystem: string = "json-editor",
    createdBy?: string
  ): Promise<{
    status: "success" | "partial" | "error";
    results: Array<{
      changeId: string;
      success: boolean;
      error?: string;
    }>;
    metrics?: {
      totalChanges: number;
      successfulChanges: number;
      failedChanges: number;
      processingTimeMs: number;
    };
  }> {
    const startTime = Date.now();
    const results: Array<{
      changeId: string;
      success: boolean;
      error?: string;
    }> = [];

    // Group changes by type for batch processing
    const addChanges = changes.filter((c) => c.type === "ADD");
    const mapChanges = changes.filter((c) => c.type === "MAP");
    const trashChanges = changes.filter((c) => c.type === "TRASH");

    try {
      // Use Prisma transaction for atomicity
      await prisma.$transaction(async (tx) => {
        // Process ADD changes
        for (const change of addChanges) {
          try {
            const name = change.rawValue.replace(/_/g, " ").toUpperCase();
            // Use the existing method but skip cache invalidation (we'll do it once at the end)
            await this.approveAsNewCanonical(
              name,
              sourceSystem,
              undefined, // category
              undefined, // code (auto-generated)
              createdBy
            );
            results.push({ changeId: change.id, success: true });
          } catch (error) {
            results.push({
              changeId: change.id,
              success: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        // Process MAP changes
        for (const change of mapChanges) {
          try {
            if (!change.targetValue) {
              results.push({
                changeId: change.id,
                success: false,
                error: "targetValue is required for MAP changes",
              });
              continue;
            }

            // Get equipment IDs from target names
            const targetNames = Array.isArray(change.targetValue)
              ? change.targetValue
              : [change.targetValue];

            // Batch lookup all equipment by name
            const targetEquipment = await tx.equipment.findMany({
              where: {
                name: { in: targetNames.map((n) => n.toUpperCase()) },
                binCategory: "bin_good",
              },
              select: { id: true },
            });

            if (targetEquipment.length === 0) {
              results.push({
                changeId: change.id,
                success: false,
                error: "Target equipment not found",
              });
              continue;
            }

            const targetEquipmentIds = targetEquipment.map((e) => e.id);
            await this.mapToExistingCanonical(
              change.rawValue,
              sourceSystem,
              targetEquipmentIds[0],
              createdBy,
              targetEquipmentIds
            );
            results.push({ changeId: change.id, success: true });
          } catch (error) {
            results.push({
              changeId: change.id,
              success: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }

        // Process TRASH changes
        for (const change of trashChanges) {
          try {
            const name = change.rawValue.replace(/_/g, " ").toUpperCase();
            await this.markAsTrash(name, sourceSystem, undefined, createdBy);
            results.push({ changeId: change.id, success: true });
          } catch (error) {
            results.push({
              changeId: change.id,
              success: false,
              error: error instanceof Error ? error.message : String(error),
            });
          }
        }
      });

      // Invalidate dictionary cache once after all changes (performance optimization)
      // Note: Individual methods also invalidate, but this ensures it's done once at the end
      invalidateEquipmentDictionaryCache();

      const successfulChanges = results.filter((r) => r.success).length;
      const failedChanges = results.filter((r) => !r.success).length;
      const processingTimeMs = Date.now() - startTime;

      return {
        status:
          failedChanges === 0
            ? "success"
            : successfulChanges > 0
            ? "partial"
            : "error",
        results,
        metrics: {
          totalChanges: changes.length,
          successfulChanges,
          failedChanges,
          processingTimeMs,
        },
      };
    } catch (error) {
      // Transaction failed - mark all as failed
      changes.forEach((change) => {
        if (!results.find((r) => r.changeId === change.id)) {
          results.push({
            changeId: change.id,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      });

      return {
        status: "error",
        results,
        metrics: {
          totalChanges: changes.length,
          successfulChanges: 0,
          failedChanges: changes.length,
          processingTimeMs: Date.now() - startTime,
        },
      };
    }
  }
}

export const equipmentAdminService = new EquipmentAdminService();
