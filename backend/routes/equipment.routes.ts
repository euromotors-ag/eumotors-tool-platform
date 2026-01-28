import express from "express";
import { equipmentController } from "../controllers/equipment.controller.js";

const router = express.Router();

// IMPORTANT: Specific routes must come before parameterized routes!

// GET /api/v1/equipment/categories - Get all equipment categories
router.get("/categories", equipmentController.getEquipmentCategories);

// GET /api/v1/equipment/category/:category - Get equipment by functional category
router.get("/category/:category", equipmentController.getEquipmentByFunctionalCategory);

// GET /api/v1/equipment/check?name=... - Check if equipment exists
router.get("/check", equipmentController.checkEquipment);

// GET /api/v1/equipment/trash/check?name=... - Check if equipment is trash
router.get("/trash/check", equipmentController.checkTrash);

// POST /api/v1/equipment/validate - Batch validate equipment
router.post("/validate", equipmentController.validateEquipment);

// POST /api/v1/equipment/normalize - Normalize equipment list
router.post("/normalize", equipmentController.normalizeEquipment);

// POST /api/v1/equipment/approve - Approve unknown as new canonical
router.post("/approve", equipmentController.approveAsNewCanonical);

// POST /api/v1/equipment/map - Map unknown to existing canonical
router.post("/map", equipmentController.mapToExistingCanonical);

// DELETE /api/v1/equipment/map - Delete mapping (undo mapping action)
router.delete("/map", equipmentController.deleteMapping);

// POST /api/v1/equipment/trash - Mark equipment as trash
router.post("/trash", equipmentController.markAsTrash);

// POST /api/v1/equipment/restore - Restore equipment from trash (undo trash action)
router.post("/restore", equipmentController.restoreFromTrash);

// POST /api/v1/equipment/batch-sync - Batch sync equipment changes (ADD, MAP, TRASH)
router.post("/batch-sync", equipmentController.batchSync);

// GET /api/v1/equipment/canonical/all - Get all canonical equipment
router.get("/canonical/all", equipmentController.getAllCanonical);

// POST /api/v1/equipment - Create equipment
router.post("/", equipmentController.createEquipment);

// PUT /api/v1/equipment/:name - Update equipment binCategory
router.put("/:name", equipmentController.updateEquipment);

// DELETE /api/v1/equipment/:name - Delete equipment
router.delete("/:name", equipmentController.deleteEquipment);

// GET /api/v1/equipment/:binCategory - Get equipment by binCategory (bin_good or bin_trash)
// MUST BE LAST to avoid matching /categories, /check, etc.
router.get("/:binCategory", equipmentController.getEquipmentByCategory);

export default router;
