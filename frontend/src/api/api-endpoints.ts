export const BASE_URL = import.meta.env.VITE_API_URL || "";

const IMAGE_PROCESS_ENDPOINT =
  import.meta.env.VITE_IMAGE_PROCESS_ENDPOINT || "";
const SCRAPE_ENDPOINT = import.meta.env.VITE_SCRAPE_ENDPOINT || "";

export const API_ENDPOINTS = {
  images: {
    process: `${BASE_URL}${IMAGE_PROCESS_ENDPOINT}`,
  },
  scrape: {
    scrape: `${BASE_URL}${SCRAPE_ENDPOINT}`,
    downloadImage: `${BASE_URL}${SCRAPE_ENDPOINT}/download-image`,
  },
} as const;
