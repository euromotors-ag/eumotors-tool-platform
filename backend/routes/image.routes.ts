import multer from "multer";
import express from "express";
import { UPLOAD_LIMITS } from "@utils/constants.js";
import { validateImageUpload } from "@middlewares/validation.js";
import { imageController } from "@controllers/image.controller.js";

const router = express.Router();

// Configure multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD_LIMITS.MAX_FILE_SIZE },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new Error("Only image files are allowed"));
    }
    callback(null, true);
  },
});

router.post(
  "/process",
  upload.single("image"),
  validateImageUpload,
  imageController.processImage
);

export default router;
