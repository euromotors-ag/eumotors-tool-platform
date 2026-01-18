import { prisma } from "../lib/prisma.js";
import { EquipmentBin } from "@prisma/client";
import {
  NormalizedEquipmentItem,
  EquipmentNormalizationService,
  equipmentNormalizationService,
} from "./equipment-normalization.service.js";

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
   * 
   * @param rawValue The raw equipment value to map
   * @param sourceSystem Source system identifier
   * @param targetEquipmentId The ID of the canonical equipment to map to
   * @param createdBy Optional user identifier
   */
  async mapToExistingCanonical(
    rawValue: string,
    sourceSystem: string,
    targetEquipmentId: string,
    createdBy?: string
  ): Promise<NormalizedEquipmentItem> {
    const upperRawValue = rawValue.toUpperCase().trim();

    // Verify target equipment exists and is canonical (bin_good)
    const targetEquipment = await prisma.equipment.findFirst({
      where: {
        id: targetEquipmentId,
        binCategory: "bin_good",
      },
    });

    if (!targetEquipment) {
      throw new Error(
        `Canonical equipment with ID ${targetEquipmentId} not found or is not in bin_good`
      );
    }

    // Create or update mapping
    await prisma.equipmentMapping.upsert({
      where: {
        sourceSystem_rawValue: {
          sourceSystem,
          rawValue: upperRawValue,
        },
      },
      update: {
        equipmentId: targetEquipmentId,
        updatedAt: new Date(),
      },
      create: {
        sourceSystem,
        rawValue: upperRawValue,
        equipmentId: targetEquipmentId,
        createdBy: createdBy || null,
      },
    });

    return {
      rawValue: upperRawValue,
      status: "GREEN",
      canonicalCode: targetEquipment.code || undefined,
      canonicalLabel: targetEquipment.name,
      equipmentId: targetEquipment.id,
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
