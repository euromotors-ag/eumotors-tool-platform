/**
 * API service for reference data (equipment dictionary)
 */

import axios from "axios";
import { Result, EquipmentDictionarySnapshot } from "../types/json-editor.types";
import { API_BASE_URL } from "../api/api-base-url";

/**
 * Fetch equipment dictionary with ETag support
 */
export async function fetchEquipmentDictionary(
  etag?: string
): Promise<Result<EquipmentDictionarySnapshot, string>> {
  try {
    const headers: Record<string, string> = {};
    if (etag) {
      headers["If-None-Match"] = etag;
    }

    const response = await axios.get<EquipmentDictionarySnapshot>(
      `${API_BASE_URL}/api/reference/equipment`,
      {
        headers,
        validateStatus: (status) => status === 200 || status === 304,
      }
    );

    if (response.status === 304) {
      // Not modified - return error to indicate cache hit (client should use cached version)
      return Result.err("NOT_MODIFIED");
    }

    return Result.ok(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return Result.err(
        `Failed to fetch equipment dictionary: ${error.message}`
      );
    }
    return Result.err(
      `Unknown error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Submit unknown equipment codes for review
 */
export async function submitEquipmentSuggestions(
  unknownCodes: string[]
): Promise<Result<{ success: boolean; count: number }, string>> {
  try {
    const response = await axios.post<{ success: boolean; count: number }>(
      `${API_BASE_URL}/api/reference/equipment/suggest`,
      { unknownCodes }
    );

    return Result.ok(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      return Result.err(
        `Failed to submit suggestions: ${error.message}`
      );
    }
    return Result.err(
      `Unknown error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
