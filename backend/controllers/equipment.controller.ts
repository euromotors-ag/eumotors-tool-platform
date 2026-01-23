import { Request, Response } from "express";
import { equipmentService } from "../services/equipment.service.js";
import { equipmentNormalizationService } from "../services/equipment-normalization.service.js";
import { equipmentAdminService } from "../services/equipment-admin.service.js";
import { EquipmentBin } from "@prisma/client";

/**
 * Get all equipment by category
 */
const getEquipmentByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { binCategory } = req.params;

    if (binCategory !== "bin_good" && binCategory !== "bin_trash") {
      res.status(400).json({
        status: "error",
        message: "Invalid category. Must be 'bin_good' or 'bin_trash'",
      });
      return;
    }

    const equipment = await equipmentService.getEquipmentByCategory(
      binCategory as EquipmentBin
    );
    res.json({ status: "success", data: equipment });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Check if equipment exists in database
 */
const checkEquipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      res.status(400).json({
        status: "error",
        message: "Equipment name is required",
      });
      return;
    }

    const exists = await equipmentService.isEquipmentInDatabase(name);
    res.json({ status: "success", exists });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Check if equipment is in trash
 */
const checkTrash = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      res.status(400).json({
        status: "error",
        message: "Equipment name is required",
      });
      return;
    }

    const isTrash = await equipmentService.isEquipmentInTrash(name);
    res.json({ status: "success", isTrash });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Create equipment
 */
const createEquipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, binCategory, category, source } = req.body;

    if (!name || !binCategory) {
      res.status(400).json({
        status: "error",
        message: "Name and binCategory are required",
      });
      return;
    }

    if (binCategory !== "bin_good" && binCategory !== "bin_trash") {
      res.status(400).json({
        status: "error",
        message: "Invalid binCategory. Must be 'bin_good' or 'bin_trash'",
      });
      return;
    }

    const equipment = await equipmentService.createEquipment({
      name,
      binCategory: binCategory as EquipmentBin,
      category,
      source,
    });

    res.status(201).json({ status: "success", data: equipment });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Update equipment category
 */
const updateEquipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    const { binCategory } = req.body;

    if (!binCategory || (binCategory !== "bin_good" && binCategory !== "bin_trash")) {
      res.status(400).json({
        status: "error",
        message: "Valid binCategory is required",
      });
      return;
    }

    const equipment = await equipmentService.updateEquipmentBinCategory(
      name,
      binCategory as EquipmentBin
    );

    res.json({ status: "success", data: equipment });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Delete equipment
 */
const deleteEquipment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;

    await equipmentService.deleteEquipment(name);
    res.json({ status: "success", message: "Equipment deleted" });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Validate equipment list (batch check)
 */
const validateEquipment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { equipment } = req.body; // Array of equipment names

    if (!Array.isArray(equipment)) {
      res.status(400).json({
        status: "error",
        message: "Equipment must be an array",
      });
      return;
    }

    const goodEquipment = await equipmentService.getGoodEquipment();
    const trashEquipment = await equipmentService.getTrashEquipment();

    const validation = equipment.map((name: string) => {
      const upperName = name.toUpperCase().trim();
      return {
        name: upperName,
        isValid: goodEquipment.has(upperName),
        isTrash: trashEquipment.has(upperName),
      };
    });

    res.json({ status: "success", data: validation });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Get all equipment categories
 */
const getEquipmentCategories = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const categories = await equipmentService.getEquipmentCategories();
    res.json({ status: "success", data: categories });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Get equipment by functional category
 */
const getEquipmentByFunctionalCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { category } = req.params;

    if (!category) {
      res.status(400).json({
        status: "error",
        message: "Category is required",
      });
      return;
    }

    const equipment =
      await equipmentService.getEquipmentByFunctionalCategory(category);
    res.json({ status: "success", data: equipment });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Normalize equipment list
 */
const normalizeEquipment = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { equipment, sourceSystem, carId, insertAuditTrail } = req.body;

    if (!Array.isArray(equipment)) {
      res.status(400).json({
        status: "error",
        message: "Equipment must be an array",
      });
      return;
    }

    if (!sourceSystem || typeof sourceSystem !== "string") {
      res.status(400).json({
        status: "error",
        message: "sourceSystem is required",
      });
      return;
    }

    const result = await equipmentNormalizationService.normalizeEquipment(
      equipment,
      sourceSystem,
      carId,
      insertAuditTrail || false
    );

    res.json({ status: "success", data: result });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Approve unknown equipment as new canonical
 */
const approveAsNewCanonical = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { rawValue, sourceSystem, category, code } = req.body;

    if (!rawValue || !sourceSystem) {
      res.status(400).json({
        status: "error",
        message: "rawValue and sourceSystem are required",
      });
      return;
    }

    const result = await equipmentAdminService.approveAsNewCanonical(
      rawValue,
      sourceSystem,
      category,
      code
    );

    res.json({ status: "success", data: result });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Map unknown equipment to existing canonical
 */
const mapToExistingCanonical = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { rawValue, sourceSystem, targetEquipmentId, targetEquipmentIds } = req.body;

    if (!rawValue || typeof rawValue !== "string") {
      res.status(400).json({
        status: "error",
        message: "rawValue is required",
      });
      return;
    }

    if (!sourceSystem || typeof sourceSystem !== "string") {
      res.status(400).json({
        status: "error",
        message: "sourceSystem is required",
      });
      return;
    }

    // Support both single mapping (targetEquipmentId) and multi-mapping (targetEquipmentIds)
    if (targetEquipmentIds && Array.isArray(targetEquipmentIds)) {
      // Multi-mapping: validate array
      if (targetEquipmentIds.length === 0) {
        res.status(400).json({
          status: "error",
          message: "targetEquipmentIds must contain at least one equipment ID",
        });
        return;
      }
      
      // Use first ID as fallback for backward compatibility in return value
      const result = await equipmentAdminService.mapToExistingCanonical(
        rawValue,
        sourceSystem,
        targetEquipmentIds[0],
        undefined,
        targetEquipmentIds
      );
      res.json({ status: "success", data: result });
    } else if (targetEquipmentId && typeof targetEquipmentId === "string") {
      // Single mapping (backward compatibility)
      const result = await equipmentAdminService.mapToExistingCanonical(
        rawValue,
        sourceSystem,
        targetEquipmentId
      );
      res.json({ status: "success", data: result });
    } else {
      res.status(400).json({
        status: "error",
        message: "Either targetEquipmentId (string) or targetEquipmentIds (array) is required",
      });
      return;
    }
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Mark equipment as trash
 */
const markAsTrash = async (req: Request, res: Response): Promise<void> => {
  try {
    const { rawValue, sourceSystem, reason } = req.body;

    if (!rawValue) {
      res.status(400).json({
        status: "error",
        message: "rawValue is required",
      });
      return;
    }

    const result = await equipmentAdminService.markAsTrash(
      rawValue,
      sourceSystem,
      reason
    );

    res.json({ status: "success", data: result });
  } catch (error) {
    handleError(error, res);
  }
};

/**
 * Get all canonical equipment
 */
const getAllCanonical = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const equipment = await equipmentAdminService.getAllCanonicalEquipment();
    res.json({ status: "success", data: equipment });
  } catch (error) {
    handleError(error, res);
  }
};

function handleError(error: unknown, res: Response): void {
  console.error("Equipment controller error:", error);
  const errorMessage =
    error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({
    status: "error",
    message: errorMessage,
  });
}

export const equipmentController = {
  getEquipmentByCategory, // By binCategory (bin_good/bin_trash)
  getEquipmentByFunctionalCategory, // By functional category
  getEquipmentCategories, // Get all categories
  checkEquipment,
  checkTrash,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  validateEquipment,
  normalizeEquipment,
  approveAsNewCanonical,
  mapToExistingCanonical,
  markAsTrash,
  getAllCanonical,
};
