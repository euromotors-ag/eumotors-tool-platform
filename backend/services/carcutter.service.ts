import { fileTypeFromBuffer, FileTypeResult } from "file-type/core";
import { API_CONFIG } from "@config/api-endpoints.js";
import { API_TIMEOUTS, API_STATUSES, FORM_FIELDS } from "@utils/constants.js";

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
    formData.append(
      FORM_FIELDS.LICENSE_PLATE,
      new Blob([new Uint8Array(req.license_plate || Buffer.from([]))])
    );
    formData.append(
      FORM_FIELDS.OVERLAY,
      new Blob([new Uint8Array(req.overlay || Buffer.from([]))])
    );
    formData.append(FORM_FIELDS.SCENE, req.scene_id!);

    if (req.cut_type) {
      formData.append("cut_type", req.cut_type);
    }
    formData.append("processing_speed", "normal");
    formData.append("retouching_accuracy", "precise");
  }

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
