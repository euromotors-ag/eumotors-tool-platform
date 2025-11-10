import express from "express";
import { editImages } from "@config/default-profiles.js";

interface ErrorResponse {
  status: string;
  message: string;
  code?: number;
}

const processImage = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    if (!req.file) {
      sendErrorResponse(res, 400, "Image file must be provided");
      return;
    }
    const img = req.file;

    const { profile_key } = req.body;

    const imgDataPromises = await editImages({
      imgs: [img.buffer],
      profile_key,
    });

    const imgData = await imgDataPromises[0];

    res.set("Content-Type", imgData.fileType.mime);
    res.send(imgData.buffer);
    return;
  } catch (error) {
    handleRequestError(error, res);
  }
};

const processMultipleImages = async (
  req: express.Request,
  res: express.Response
): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      sendErrorResponse(res, 400, "Image files must be provided");
      return;
    }

    const { profile_key } = req.body;

    // Send a quick response to client to avoid timeout
    res.status(202).json({
      status: "processing",
      message: `Processing ${req.files.length} images`,
      jobId: Date.now().toString(),
    });

    // Process in background after response is sent
    processImagesInBackground(req.files, profile_key);
  } catch (error) {
    handleRequestError(error, res);
  }
};

async function processImagesInBackground(
  files: Express.Multer.File[],
  profileKey: string
): Promise<void> {
  try {
    for (const file of files) {
      await editImages({
        imgs: [file.buffer],
        profile_key: profileKey,
      });

      console.log(`Processed image: ${file.originalname}`);
    }
    console.log("All images processed successfully");
  } catch (error) {
    console.error("Background processing error:", error);
  }
}

function handleRequestError(error: unknown, res: express.Response): void {
  console.error("Request error:", error);
  console.error("[JSON]:", JSON.stringify(error, null, 2));

  sendErrorResponse(res, 500, "Internal server error");
}

function sendErrorResponse(
  res: express.Response,
  statusCode: number,
  message: string,
  code?: number
): void {
  const errorResponse: ErrorResponse = {
    status: "error",
    message,
  };

  if (code) {
    errorResponse.code = code;
  }

  res.status(statusCode).json(errorResponse);
}

export const imageController = {
  processImage,
  processMultipleImages,
};
