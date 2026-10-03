export const API_TIMEOUTS = {
  MAX_TIMEOUT: 300000,
  RETRY_TIMEOUT: 5000,
};

export const API_STATUSES = {
  ACCEPTING_STATUSES: ["raw", "final"] as string[],
};

export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024,
  MAX_BATCH_SIZE: 60,
};

export const SCENE_IDS = {
  DEFAULT: "mey28",
};

export const PROCESSING_OPTIONS = {
  SPEED: "normal",
  RETOUCHING_ACCURACY: "precise",
};

export const CUT_TYPES = {
  DEFAULT: "complete",
  NORMAL: "normal",
  BLUR: "blur",
  NONE: "none",
};

export const FORM_FIELDS = {
  LICENSE_PLATE: "license_plate",
  OVERLAY: "overlay",
  SCENE: "scene_id",
  IMAGE_URL: "image_url",
  BACKGROUND: "background",
  CUT: "cut_type",
} as const;
