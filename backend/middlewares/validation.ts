import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import { DEFAULT_PROFILES } from "../types/types.js";

const validProfileKeys = Object.keys(DEFAULT_PROFILES);

export const validateImageUpload = [
  body("profile_key")
    .isIn(validProfileKeys)
    .withMessage(`Profile key must be one of: ${validProfileKeys.join(", ")}`),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "error",
        errors: errors.array(),
      });
    }
    next();
  },
];
