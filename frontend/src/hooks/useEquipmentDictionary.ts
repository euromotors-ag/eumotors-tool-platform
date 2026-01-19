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
 * Falls back to cached data if fetch fails (graceful degradation)
 */
export function useEquipmentDictionary() {
  return useQuery<EquipmentDictionarySnapshot, Error>({
    queryKey: [CACHE_KEY],
    queryFn: async () => {
      // Try to get cached ETag from localStorage
      const cachedEtag = localStorage.getItem(`${CACHE_KEY}-etag`);
      
      const result = await fetchEquipmentDictionary(cachedEtag || undefined);
      
      if (result.isErr()) {
        const errorMsg = result.unwrapErr();
        
        if (errorMsg === "NOT_MODIFIED") {
          // Return cached version from localStorage
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            return JSON.parse(cached) as EquipmentDictionarySnapshot;
          }
        }
        
        // If fetch fails, try to use cached data as fallback
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          const cachedData = JSON.parse(cached) as EquipmentDictionarySnapshot;
          // Mark as stale but return it anyway
          return {
            ...cachedData,
            stale: true,
          };
        }
        
        // No cache available, throw error
        throw new Error(errorMsg);
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
    retry: 1, // Reduced retries to fail faster
    retryDelay: 500, // Faster retry delay
    refetchOnWindowFocus: false, // Don't refetch on window focus if backend is down
  });
}
