import axios from "axios";
import { API_ENDPOINTS } from "./api-endpoints";

export interface ScrapeResponse {
  original_title: string;
  image_urls: string[];
}

export async function scrapeUrl(url: string): Promise<ScrapeResponse> {
  try {
    const response = await axios.post<ScrapeResponse>(
      API_ENDPOINTS.scrape.scrape,
      {
        url,
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(
        error.response.data.error || "Ett fel inträffade vid skrapning"
      );
    }
    throw new Error("Kunde inte ansluta till API:et");
  }
}
