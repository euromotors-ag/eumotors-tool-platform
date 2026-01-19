import { EquipmentBin } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { invalidateEquipmentDictionaryCache } from "./reference.service.js";

export interface EquipmentDto {
  name: string;
  binCategory: EquipmentBin;
  category?: string; // Funktionell kategori (t.ex. "Safety & Performance", "Comfort", "Technology")
  source?: string;
}

export interface EquipmentResponse {
  id: string;
  name: string;
  binCategory: EquipmentBin;
  category: string | null;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Equipment Service - Business Logic Layer
 * Follows SOLID principles: Single Responsibility, Dependency Inversion
 */
export class EquipmentService {
  /**
   * Get all equipment by category
   */
  async getEquipmentByCategory(
    category: EquipmentBin
  ): Promise<EquipmentResponse[]> {
    return prisma.equipment.findMany({
      where: { binCategory: category },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get all "good" equipment (for validation)
   */
  async getGoodEquipment(): Promise<Set<string>> {
    const equipment = await prisma.equipment.findMany({
      where: { binCategory: "bin_good" },
      select: { name: true },
    });
    return new Set(equipment.map((e) => e.name.toUpperCase()));
  }

  /**
   * Get all "trash" equipment (for filtering)
   */
  async getTrashEquipment(): Promise<Set<string>> {
    const equipment = await prisma.equipment.findMany({
      where: { binCategory: "bin_trash" },
      select: { name: true },
    });
    return new Set(equipment.map((e) => e.name.toUpperCase()));
  }

  /**
   * Check if equipment exists in database (case-insensitive)
   */
  async isEquipmentInDatabase(name: string): Promise<boolean> {
    const upperName = name.toUpperCase().trim();
    const equipment = await prisma.equipment.findFirst({
      where: {
        name: {
          equals: upperName,
          mode: "insensitive",
        },
        binCategory: "bin_good",
      },
    });
    return !!equipment;
  }

  /**
   * Check if equipment is in trash bin
   */
  async isEquipmentInTrash(name: string): Promise<boolean> {
    const upperName = name.toUpperCase().trim();
    const equipment = await prisma.equipment.findFirst({
      where: {
        name: {
          equals: upperName,
          mode: "insensitive",
        },
        binCategory: "bin_trash",
      },
    });
    return !!equipment;
  }

  /**
   * Create equipment (upsert)
   */
  async createEquipment(dto: EquipmentDto): Promise<EquipmentResponse> {
    const upperName = dto.name.toUpperCase().trim();
    const result = await prisma.equipment.upsert({
      where: { name: upperName },
      update: {
        binCategory: dto.binCategory,
        category: dto.category || null,
        source: dto.source || "manual",
        updatedAt: new Date(),
      },
      create: {
        name: upperName,
        binCategory: dto.binCategory,
        category: dto.category || null,
        source: dto.source || "manual",
      },
    });

    // Invalidate dictionary cache to ensure fresh data on next request
    // Only invalidate if equipment is in bin_good (affects dictionary)
    if (result.binCategory === "bin_good") {
      invalidateEquipmentDictionaryCache();
    }

    return result;
  }

  /**
   * Update equipment category
   */
  async updateEquipmentBinCategory(
    name: string,
    binCategory: EquipmentBin
  ): Promise<EquipmentResponse> {
    const upperName = name.toUpperCase().trim();
    return prisma.equipment.update({
      where: { name: upperName },
      data: { binCategory, updatedAt: new Date() },
    });
  }

  /**
   * Delete equipment
   */
  async deleteEquipment(name: string): Promise<void> {
    const upperName = name.toUpperCase().trim();
    await prisma.equipment.delete({
      where: { name: upperName },
    });
  }

  /**
   * Bulk create equipment
   */
  async bulkCreateEquipment(
    equipment: EquipmentDto[]
  ): Promise<{ count: number }> {
    const data = equipment.map((e) => ({
      name: e.name.toUpperCase().trim(),
      binCategory: e.binCategory,
      category: e.category || null,
      source: e.source || "manual",
    }));

    return prisma.equipment.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Get all equipment categories (distinct)
   */
  async getEquipmentCategories(): Promise<string[]> {
    const equipment = await prisma.equipment.findMany({
      where: {
        binCategory: "bin_good",
        category: { not: null },
      },
      select: { category: true },
      distinct: ["category"],
    });
    return equipment
      .map((e) => e.category)
      .filter((cat): cat is string => cat !== null)
      .sort();
  }

  /**
   * Get equipment by functional category
   */
  async getEquipmentByFunctionalCategory(
    category: string
  ): Promise<EquipmentResponse[]> {
    return prisma.equipment.findMany({
      where: {
        binCategory: "bin_good",
        category,
      },
      orderBy: { name: "asc" },
    });
  }
}

export const equipmentService = new EquipmentService();
