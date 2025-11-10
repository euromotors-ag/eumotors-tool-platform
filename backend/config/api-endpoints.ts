import { getEnvVar } from "@utils/get-env-var.js";

// CarCutter API Configuration
export const CAR_CUTTER_API = {
  SUBMIT: getEnvVar("CAR_CUTTER_SUBMIT_URL"),
  STATUS: getEnvVar("CAR_CUTTER_STATUS_URL"),
  GET: getEnvVar("CAR_CUTTER_RESULT_URL"),
  KEY: getEnvVar("CAR_CUTTER_API_KEY"),
} as const;

// AWS S3 Configuration
export const AWS_S3_CONFIG = {
  BUCKET_NAME: getEnvVar("AWS_S3_BUCKET_NAME"),
  BUCKET_REGION: getEnvVar("AWS_S3_BUCKET_REGION"),
  ACCESS_KEY: getEnvVar("AWS_S3_BUCKET_ACCESS_KEY"),
  SECRET_KEY: getEnvVar("AWS_S3_BUCKET_SECRET_KEY"),
} as const;

// All API configurations in one place
export const API_CONFIG = {
  CAR_CUTTER: CAR_CUTTER_API,
  AWS_S3: AWS_S3_CONFIG,
} as const;
