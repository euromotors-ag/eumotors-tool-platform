import express from "express";
import { enumController } from "../controllers/enum.controller.js";

const router = express.Router();

// GET /api/v1/enums/:type - Get all enums by type (body_type, fuel_type, etc.)
router.get("/:type", enumController.getEnumsByType);

// GET /api/v1/enums/models/options - Get MODEL_OPTIONS structure (brand -> models)
router.get("/models/options", enumController.getModelOptions);

// GET /api/v1/enums/models/:brand - Get models by brand
router.get("/models/:brand", enumController.getModelsByBrand);

// POST /api/v1/enums - Create enum
router.post("/", enumController.createEnum);

// DELETE /api/v1/enums/:type/:name?parentId=... - Delete enum
router.delete("/:type/:name", enumController.deleteEnum);

export default router;
