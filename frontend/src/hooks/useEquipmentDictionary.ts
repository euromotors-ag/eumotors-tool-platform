/**
 * React Query hook for equipment dictionary
 * Handles caching, ETag, and automatic refetching
 */

import { useQuery } from "@tanstack/react-query";
import { fetchEquipmentDictionary } from "../services/reference.api";
import { EquipmentDictionarySnapshot } from "../types/json-editor.types";

const CACHE_KEY = "equipment-dictionary";
const STALE_TIME = 10 * 60 * 1000; // 10 minutes

/**
 * Hook to get equipment dictionary with React Query caching
 */
export function useEquipmentDictionary() {
  return useQuery<EquipmentDictionarySnapshot, Error>({
    queryKey: [CACHE_KEY],
    queryFn: async () => {
      // Try to get cached ETag from localStorage
      const cachedEtag = localStorage.getItem(`${CACHE_KEY}-etag`);
      
      const result = await fetchEquipmentDictionary(cachedEtag || undefined);
      
      if (result.isErr()) {
        if (result.unwrapErr() === "NOT_MODIFIED") {
          // Return cached version from localStorage
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            return JSON.parse(cached) as EquipmentDictionarySnapshot;
          }
        }
        throw new Error(result.unwrapErr());
      }

      const data = result.unwrap();
      
      // Store in localStorage for offline support
      localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(`${CACHE_KEY}-etag`, data.checksum);
      localStorage.setItem(`${CACHE_KEY}-fetchedAt`, data.fetchedAt.toString());

      return data;
    },
    staleTime: STALE_TIME,
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    retry: 2,
    retryDelay: 1000,
  });
}
