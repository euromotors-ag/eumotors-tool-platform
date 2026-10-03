import { fileTypeFromBuffer, FileTypeResult } from "file-type/core";
import { API_CONFIG } from "@config/api-endpoints.js";
import {
  API_TIMEOUTS,
  API_STATUSES,
  FORM_FIELDS,
  PROCESSING_OPTIONS,
} from "@utils/constants.js";

export type CarCutterRequest = {
  urls: string[];
  license_plate?: Buffer;
  overlay?: Buffer;
  scene_id?: string;
  cut_type?: string;
  background?: Buffer;
};

export function sendRequest(req: CarCutterRequest): Promise<Response> {
  const formData = createMultipart(req);

  return fetch(API_CONFIG.CAR_CUTTER.SUBMIT, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
    },
    body: formData,
  });
}

function isRemoveBgProfile(req: CarCutterRequest): boolean {
  return !!req.cut_type && !!req.background;
}

export function createMultipart(req: CarCutterRequest): FormData {
  const { urls } = req;
  const formData = new FormData();

  urls.forEach((url) => {
    formData.append(FORM_FIELDS.IMAGE_URL, url);
  });

  if (isRemoveBgProfile(req)) {
    formData.append(FORM_FIELDS.CUT, req.cut_type!);
    formData.append(
      FORM_FIELDS.BACKGROUND,
      new Blob([new Uint8Array(req.background!)])
    );
  } else {
    // (Euro Motors, CarTrade24)
    if (req.license_plate) {
      formData.append(
        FORM_FIELDS.LICENSE_PLATE,
        new Blob([new Uint8Array(req.license_plate)])
      );
    }
    if (req.overlay) {
      formData.append(
        FORM_FIELDS.OVERLAY,
        new Blob([new Uint8Array(req.overlay)])
      );
    }
    if (req.scene_id) {
      formData.append(FORM_FIELDS.SCENE, req.scene_id);
    }

    if (req.cut_type) {
      formData.append("cut_type", req.cut_type);
    }
    formData.append("processing_speed", PROCESSING_OPTIONS.SPEED);
    formData.append("retouching_accuracy", PROCESSING_OPTIONS.RETOUCHING_ACCURACY);
  }

  return formData;
}

export type CarCutterSyncRequest = {
  url: string;
  cut_type?: string;
  background?: Buffer;
  scene_id?: string;
};

/**
 * Processes a single image with the synchronous endpoint.
 * The response body is the result image encoded as base64 (errors are JSON).
 * NOTE: the sync endpoint returns the existing result if the same image_url was processed
 * before, so callers must pass a URL that is unique per profile.
 */
export async function processImageSync(
  req: CarCutterSyncRequest
): Promise<ImageData> {
  const response = await fetch(API_CONFIG.CAR_CUTTER.SYNC, {
    method: "POST",
    headers: {
      ...getAuthHeader(),
    },
    body: createSyncMultipart(req),
    signal: AbortSignal.timeout(API_TIMEOUTS.MAX_TIMEOUT),
  });

  const body = await response.text();

  if (!response.ok) {
    console.error("Response:", body.slice(0, 500));
    throw new Error(`Failed to process image: ${response.statusText}`);
  }

  const buffer = Buffer.from(body, "base64");

  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType || !fileType.mime.startsWith("image/")) {
    throw new Error("Retrieved file is not an image");
  }

  return { buffer, fileType };
}

function createSyncMultipart(req: CarCutterSyncRequest): FormData {
  const formData = new FormData();

  formData.append(FORM_FIELDS.IMAGE_URL, req.url);

  if (req.cut_type) {
    formData.append(FORM_FIELDS.CUT, req.cut_type);
  }
  // A scene overrides any custom background
  if (req.scene_id) {
    formData.append(FORM_FIELDS.SCENE, req.scene_id);
  }
  if (req.background) {
    formData.append(
      FORM_FIELDS.BACKGROUND,
      new Blob([new Uint8Array(req.background)], { type: "image/jpeg" }),
      "background.jpg"
    );
  }
  formData.append("processing_speed", PROCESSING_OPTIONS.SPEED);
  formData.append("retouching_accuracy", PROCESSING_OPTIONS.RETOUCHING_ACCURACY);

  return formData;
}

export async function handleResponse(
  req: CarCutterRequest,
  response: Response
): Promise<Promise<ImageData>[]> {
  if (!response.ok) {
    console.error("Response:", await response.json().catch((e) => undefined));
    throw new Error(`Failed to submit images: ${response.statusText}`);
  }

  return req.urls.map(fetchResult);
}

async function waitForEdit(
  imgUrl: string,
  timeout: number = API_TIMEOUTS.MAX_TIMEOUT
): Promise<void> {
  const url = new URL(API_CONFIG.CAR_CUTTER.STATUS);
  url.searchParams.set("image_url", imgUrl);

  const startTime = +new Date();

  while (true) {
    const status = await fetchStatus(url);

    if (API_STATUSES.ACCEPTING_STATUSES.includes(status)) return;

    if (+new Date() - startTime > timeout) {
      throw new Error(`Timeout waiting for image edit after ${timeout}ms`);
    }

    // Wait between checks
    await new Promise((resolve) =>
      setTimeout(resolve, API_TIMEOUTS.RETRY_TIMEOUT)
    );
  }
}

async function fetchStatus(url: URL): Promise<string> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    console.error("Response:", await response.json().catch((e) => undefined));
    throw new Error(`Failed to retrieve status: ${response.statusText}`);
  }

  const json = await response.json();

  return json.data.images[0].status;
}

export type ImageData = { buffer: Buffer; fileType: FileTypeResult };

export async function fetchResult(imgUrl: string): Promise<ImageData> {
  await waitForEdit(imgUrl);

  const url = new URL(API_CONFIG.CAR_CUTTER.GET);
  url.searchParams.set("image_url", imgUrl);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      ...getAuthHeader(),
    },
  });

  if (!response.ok) {
    console.error("Response:", await response.json().catch((e) => undefined));
    throw new Error(`Failed to retrieve status: ${response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  const fileType = await fileTypeFromBuffer(buffer);
  if (!fileType || !fileType.mime.startsWith("image/")) {
    throw new Error("Retrieved file is not an image");
  }

  return { buffer, fileType };
}

function getAuthHeader() {
  return {
    Authorization: `Bearer ${API_CONFIG.CAR_CUTTER.KEY}`,
  };
}
