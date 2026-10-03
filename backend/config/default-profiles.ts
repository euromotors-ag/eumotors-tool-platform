import {
  handleResponse,
  ImageData,
  processImageSync,
  sendRequest,
} from "@services/carcutter.service.js";
import { getTemporaryUrl } from "@services/s3.service.js";
import { compositeOnWhite } from "@services/white-background.service.js";
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

  const isSync = profile.endpoint === "sync";
  // The sync endpoint returns any earlier result for the same image_url (even one from
  // another profile), so sync profiles upload under their own namespace to get a unique URL
  const urlNamespace = isSync
    ? `sync:${"profile_key" in req ? req.profile_key : "custom"}`
    : "";

  // First upload images to S3 to get URLs that Car Cutter can access
  const urls = await uploadImages(req.imgs, urlNamespace);

  if (isSync) {
    const { lightFloorSceneId } = profile;
    // The light-floor render needs its own image_url too, for the same caching reason
    const floorUrls = lightFloorSceneId
      ? await uploadImages(req.imgs, `${urlNamespace}:floor`)
      : [];

    return urls.map(async (url, index) => {
      const render = processImageSync({
        url,
        cut_type: profile.cut_type,
        background: profile.background,
      });
      if (!lightFloorSceneId) return render;

      const [withWhiteBackdrop, withLightFloor] = await Promise.all([
        render,
        processImageSync({
          url: floorUrls[index],
          cut_type: profile.cut_type,
          scene_id: lightFloorSceneId,
        }),
      ]);

      const buffer = await compositeOnWhite(
        withWhiteBackdrop.buffer,
        withLightFloor.buffer
      );
      const fileType = await fileTypeFromBuffer(buffer);
      if (!fileType) {
        throw new Error("Composited file is not an image");
      }
      return { buffer, fileType };
    });
  }

  const carCutterReq = {
    urls,
    ...profile,
  };

  const response = await sendRequest(carCutterReq);
  return handleResponse(carCutterReq, response);
}

async function uploadImages(
  imgs: Buffer[],
  namespace: string
): Promise<string[]> {
  const uploadPromises = imgs.map(async (img) => {
    try {
      // Detect the content type of the image
      const fileType = await fileTypeFromBuffer(img);
      const contentType = fileType?.mime || "image/jpeg";

      // Upload to S3 and get URL
      return await getTemporaryUrl(img, contentType, namespace);
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw new Error("Failed to upload image to temporary storage");
    }
  });

  // Wait for all uploads to complete
  return Promise.all(uploadPromises);
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

  if (profile.endpoint === "sync" && profile.background) {
    const backgroundType = await fileTypeFromBuffer(profile.background);
    if (backgroundType?.mime !== "image/jpeg") {
      throw new Error("Background image must be a JPG file");
    }
  }
}
