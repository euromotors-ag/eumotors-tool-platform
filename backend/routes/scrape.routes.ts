import { Router } from "express";
import {
  scrapeUrl,
  downloadImageProxy,
} from "@controllers/scrape.controller.js";

const router = Router();

router.post("/", scrapeUrl);
router.post("/download-image", downloadImageProxy);

export default router;
