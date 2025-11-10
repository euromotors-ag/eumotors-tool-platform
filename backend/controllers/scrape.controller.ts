import { Request, Response } from "express";
import {
  scrapeBlocketImages,
  downloadImage,
} from "@services/scrape.service.js";

export async function scrapeUrl(req: Request, res: Response): Promise<void> {
  try {
    const { url } = req.body;

    // Validate input
    if (!url || typeof url !== "string") {
      res.status(400).json({ error: "URL is required" });
      return;
    }

    // Scrape the URL
    const result = await scrapeBlocketImages(url);
    res.status(200).json(result);
  } catch (error) {
    console.error("Scraping error:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to scrape URL",
    });
  }
}

/**
 * POST /api/v1/scrape/download-image
 * Downloads an image from a URL (proxy to bypass CORS)
 */
export async function downloadImageProxy(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { imageUrl } = req.body;

    // Validate input
    if (!imageUrl || typeof imageUrl !== "string") {
      res.status(400).json({ error: "imageUrl is required" });
      return;
    }

    // Download the image
    const result = await downloadImage(imageUrl);

    // Set content type and send the buffer
    res.setHeader("Content-Type", result.contentType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${result.fileName}"`
    );
    res.send(result.imageData);
  } catch (error) {
    console.error("Image download error:", error);
    res.status(500).json({
      error:
        error instanceof Error ? error.message : "Failed to download image",
    });
  }
}
