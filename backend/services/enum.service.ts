import { CarEnumType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export interface EnumDto {
  name: string;
  enumType: CarEnumType;
  parentId?: string; // För MODEL_OPTIONS (brand -> models)
  source?: string;
}

export interface EnumResponse {
  id: string;
  name: string;
  enumType: CarEnumType;
  parentId: string | null;
  source: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Enum Service - Business Logic Layer
 * Hanterar alla enum-typer: body_type, fuel_type, brand, model, etc.
 */
export class EnumService {
  /**
   * Get all enums by type
   */
  async getEnumsByType(enumType: CarEnumType): Promise<EnumResponse[]> {
    return prisma.carEnum.findMany({
      where: { enumType },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Get all enums by type as string array (för dropdowns)
   */
  async getEnumsByTypeAsArray(enumType: CarEnumType): Promise<string[]> {
    const enums = await prisma.carEnum.findMany({
      where: { enumType },
      select: { name: true },
      orderBy: { name: "asc" },
    });
    return enums.map((e) => e.name);
  }

  /**
   * Get models by brand (för MODEL_OPTIONS)
   */
  async getModelsByBrand(brand: string): Promise<string[]> {
    const models = await prisma.carEnum.findMany({
      where: {
        enumType: "model",
        parentId: brand.toUpperCase(),
      },
      select: { name: true },
      orderBy: { name: "asc" },
    });
    return models.map((m) => m.name);
  }

  /**
   * Get all brands (för BRAND_OPTIONS)
   */
  async getAllBrands(): Promise<string[]> {
    return this.getEnumsByTypeAsArray("brand");
  }

  /**
   * Get MODEL_OPTIONS structure (brand -> models)
   */
  async getModelOptions(): Promise<Record<string, string[]>> {
    const brands = await this.getAllBrands();
    const modelOptions: Record<string, string[]> = {};

    for (const brand of brands) {
      const models = await this.getModelsByBrand(brand);
      if (models.length > 0) {
        modelOptions[brand] = models;
      }
    }

    return modelOptions;
  }

  /**
   * Create enum (upsert)
   */
  async createEnum(dto: EnumDto): Promise<EnumResponse> {
    const upperName = dto.name.toUpperCase().trim();
    const upperParentId = dto.parentId?.toUpperCase().trim() || null;

    return prisma.carEnum.upsert({
      where: {
        name_enumType_parentId: {
          name: upperName,
          enumType: dto.enumType,
          // @ts-expect-error - Prisma's compound unique constraint types incorrectly expect 'string' instead of 'string | null' for nullable fields
          parentId: upperParentId,
        },
      },
      update: {
        source: dto.source || "manual",
        updatedAt: new Date(),
      },
      create: {
        name: upperName,
        enumType: dto.enumType,
        parentId: upperParentId,
        source: dto.source || "manual",
      },
    });
  }

  /**
   * Bulk create enums
   */
  async bulkCreateEnums(enums: EnumDto[]): Promise<{ count: number }> {
    const data = enums.map((e) => ({
      name: e.name.toUpperCase().trim(),
      enumType: e.enumType,
      parentId: e.parentId?.toUpperCase().trim() || null,
      source: e.source || "enum",
    }));

    return prisma.carEnum.createMany({
      data,
      skipDuplicates: true,
    });
  }

  /**
   * Delete enum
   */
  async deleteEnum(
    name: string,
    enumType: CarEnumType,
    parentId?: string
  ): Promise<void> {
    const upperName = name.toUpperCase().trim();
    const upperParentId = parentId?.toUpperCase().trim() || null;

    await prisma.carEnum.delete({
      where: {
        name_enumType_parentId: {
          name: upperName,
          enumType,
          // @ts-expect-error - Prisma's compound unique constraint types incorrectly expect 'string' instead of 'string | null' for nullable fields
          parentId: upperParentId,
        },
      },
    });
  }
}

export const enumService = new EnumService();
