import { generateEvilPassword } from "./genFunny";

const getEnvVar = (name: string) => {
  return import.meta.env[name];
};

export const INACTIVITY_TIMEOUT = 2 * 60 * 60 * 1000; // 2h

// Licenses CREDENTIALS
export const LICENSE_CREDS = {
  AWS_UN: getEnvVar("VITE_AWS_USERNAME"),
  AWS_PW: generateEvilPassword(getEnvVar("VITE_AWS_PASSWORD")),

  APIFY_UN: getEnvVar("VITE_APIFY_USERNAME"),
  APIFY_PW: generateEvilPassword(getEnvVar("VITE_APIFY_PASSWORD")),

  OPENAI_UN: getEnvVar("VITE_OPENAI_USERNAME"),
  OPENAI_PW: generateEvilPassword(getEnvVar("VITE_OPENAI_PASSWORD")),

  SCRAPEDO_UN: getEnvVar("VITE_SCRAPEDO_USERNAME"),
  SCRAPEDO_PW: generateEvilPassword(getEnvVar("VITE_SCRAPEDO_PASSWORD")),

  CARCUTTER_UN: getEnvVar("VITE_CARCUTTER_USERNAME"),
  CARCUTTER_PW: generateEvilPassword(getEnvVar("VITE_CARCUTTER_PASSWORD")),
} as const;
