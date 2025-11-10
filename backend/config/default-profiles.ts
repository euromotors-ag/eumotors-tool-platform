import {
  handleResponse,
  ImageData,
  sendRequest,
} from "@services/carcutter.service.js";
import { getTemporaryUrl } from "@services/s3.service.js";
import { UPLOAD_LIMITS, SCENE_IDS } from "@utils/constants.js";
import { fileTypeFromBuffer } from "file-type/core";
import { EditRequest, Profile, DEFAULT_PROFILES } from "../types/types.js";

export async function editImages(
  req: EditRequest
): Promise<Promise<ImageData>[]> {
  if (req.imgs.length > UPLOAD_LIMITS.MAX_BATCH_SIZE) {
    throw new Error("Cannot process that many images at once");
  }

  const profile: Profile =
    "profile" in req
      ? req.profile
      : DEFAULT_PROFILES[req.profile_key as keyof typeof DEFAULT_PROFILES];
  await validateProfile(profile);

  // First upload images to S3 to get URLs that Car Cutter can access
  const uploadPromises = req.imgs.map(async (img) => {
    try {
      // Detect the content type of the image
      const fileType = await fileTypeFromBuffer(img);
      const contentType = fileType?.mime || "image/jpeg";

      // Upload to S3 and get URL
      return await getTemporaryUrl(img, contentType);
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw new Error("Failed to upload image to temporary storage");
    }
  });

  // Wait for all uploads to complete
  const urls = await Promise.all(uploadPromises);

  const carCutterReq = {
    urls,
    ...profile,
  };

  const response = await sendRequest(carCutterReq);
  return handleResponse(carCutterReq, response);
}

async function validateProfile(profile: Profile): Promise<void> {
  if (profile.license_plate) {
    const lpType = await fileTypeFromBuffer(profile.license_plate);
    if (lpType?.mime !== "image/png") {
      throw new Error("License plate image must be a PNG file");
    }
  }

  if (profile.overlay) {
    const overlayType = await fileTypeFromBuffer(profile.overlay);
    if (overlayType?.mime !== "image/png") {
      throw new Error("Overlay image must be a PNG file");
    }
  }

  if (
    profile.scene_id &&
    profile.scene_id !== SCENE_IDS.DEFAULT &&
    profile.cut_type !== "complete"
  ) {
    throw new Error("Scene ID must be default value");
  }
}
