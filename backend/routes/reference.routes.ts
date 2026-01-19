/**
 * Reference data routes
 * Provides equipment dictionary with caching and ETag support
 */

import express, { Request, Response } from "express";
import { getEquipmentDictionary } from "../services/reference.service.js";

const router = express.Router();

/**
 * GET /api/reference/equipment
 * Returns equipment dictionary snapshot with caching and ETag support
 */
router.get("/equipment", async (req: Request, res: Response) => {
  try {
    const ifNoneMatch = req.headers["if-none-match"] as string | undefined;
    
    const result = await getEquipmentDictionary(ifNoneMatch);

    if (result.isErr()) {
      return res.status(500).json({
        error: "Failed to fetch equipment dictionary",
        message: result.unwrapErr(),
      });
    }

    const data = result.unwrap();

    // If client has same version, return 304 Not Modified
    if (ifNoneMatch === data.checksum) {
      return res.status(304).end();
    }

    // Set ETag header
    res.setHeader("ETag", data.checksum);
    // HTTP cache TTL: Use conservative 2 minutes to match minimum server-side TTL
    // Server-side cache uses adaptive TTL (2-5 min), but HTTP cache uses fixed 2 min for safety
    res.setHeader("Cache-Control", "public, max-age=120"); // 2 minutes

    return res.json(data);
  } catch (error) {
    console.error("Error in GET /api/reference/equipment:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /api/reference/equipment/suggest
 * Accepts unknown equipment codes for review (optional)
 */
router.post("/equipment/suggest", async (req: Request, res: Response) => {
  try {
    const { unknownCodes } = req.body;

    if (!Array.isArray(unknownCodes) || unknownCodes.length === 0) {
      return res.status(400).json({
        error: "Invalid request",
        message: "unknownCodes must be a non-empty array",
      });
    }

    // Log suggestions for review (could be persisted to DB later)
    console.log("Equipment suggestions received:", {
      codes: unknownCodes,
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: "Suggestions logged for review",
      count: unknownCodes.length,
    });
  } catch (error) {
    console.error("Error in POST /api/reference/equipment/suggest:", error);
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
