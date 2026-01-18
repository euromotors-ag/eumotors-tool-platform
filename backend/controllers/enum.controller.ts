import { Request, Response } from "express";
import { enumService } from "../services/enum.service.js";
import { CarEnumType } from "@prisma/client";

/**
 * Get all enums by type
 */
const getEnumsByType = async (req: Request, res: Response): Promise<void> => {
  try {
    const { type } = req.params;

    if (!Object.values(CarEnumType).includes(type as CarEnumType)) {
      res.status(400).json({
        status: "error",
        message: `Invalid enum type. Must be one of: ${Object.values(
          CarEnumType
        ).join(", ")}`,
      });
      return;
    }

    const enums = await enumService.getEnumsByTypeAsArray(type as CarEnumType);
    res.json({ status: "success", data: enums });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Get MODEL_OPTIONS structure (brand -> models)
 */
const getModelOptions = async (req: Request, res: Response): Promise<void> => {
  try {
    const modelOptions = await enumService.getModelOptions();
    res.json({ status: "success", data: modelOptions });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Get models by brand
 */
const getModelsByBrand = async (req: Request, res: Response): Promise<void> => {
  try {
    const { brand } = req.params;

    if (!brand) {
      res.status(400).json({
        status: "error",
        message: "Brand is required",
      });
      return;
    }

    const models = await enumService.getModelsByBrand(brand);
    res.json({ status: "success", data: models });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Create enum
 */
const createEnum = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, enumType, parentId, source } = req.body;

    if (!name || !enumType) {
      res.status(400).json({
        status: "error",
        message: "Name and enumType are required",
      });
      return;
    }

    if (!Object.values(CarEnumType).includes(enumType as CarEnumType)) {
      res.status(400).json({
        status: "error",
        message: `Invalid enumType. Must be one of: ${Object.values(
          CarEnumType
        ).join(", ")}`,
      });
      return;
    }

    const enumItem = await enumService.createEnum({
      name,
      enumType: enumType as CarEnumType,
      parentId,
      source,
    });

    res.status(201).json({ status: "success", data: enumItem });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Delete enum
 */
const deleteEnum = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type } = req.params;
    const { parentId } = req.query;

    if (!name || !type) {
      res.status(400).json({
        status: "error",
        message: "Name and type are required",
      });
      return;
    }

    await enumService.deleteEnum(
      name,
      type as CarEnumType,
      parentId as string | undefined
    );

    res.json({ status: "success", message: "Enum deleted" });
  } catch (error) {
    handleError(error, res);
  }
};

function handleError(error: unknown, res: Response): void {
  console.error("Enum controller error:", error);
  res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
}

export const enumController = {
  getEnumsByType,
  getModelOptions,
  getModelsByBrand,
  createEnum,
  deleteEnum,
};
