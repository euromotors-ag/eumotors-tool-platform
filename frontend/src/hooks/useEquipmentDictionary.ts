/**
 * React Query hook for equipment dictionary
 * Handles caching, ETag, and automatic refetching
 */

import { useQuery } from "@tanstack/react-query";
import { fetchEquipmentDictionary } from "../services/reference.api";
import { EquipmentDictionarySnapshot } from "../types/json-editor.types";

export const EQUIPMENT_DICTIONARY_CACHE_KEY = "equipment-dictionary";
const CACHE_KEY = EQUIPMENT_DICTIONARY_CACHE_KEY;
const STALE_TIME = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_AGE = 30 * 60 * 1000; // 30 minutes - max age for localStorage cache
const FRESH_FETCH_THRESHOLD = 5 * 60 * 1000; // 5 minutes - if cache is older than this and we get 304, force fresh fetch

/**
 * Clear equipment dictionary cache from localStorage
 * This should be called when we know the dictionary has changed (e.g., after saving equipment changes)
 */
export function clearEquipmentDictionaryCache(): void {
  localStorage.removeItem(CACHE_KEY);
  localStorage.removeItem(`${CACHE_KEY}-etag`);
  localStorage.removeItem(`${CACHE_KEY}-fetchedAt`);
}

/**
 * Hook to get equipment dictionary with React Query caching
 * Falls back to cached data if fetch fails (graceful degradation)
 */
export function useEquipmentDictionary() {
  return useQuery<EquipmentDictionarySnapshot, Error>({
    queryKey: [CACHE_KEY],
    queryFn: async () => {
      // Check if localStorage cache is too old
      const cachedFetchedAt = localStorage.getItem(`${CACHE_KEY}-fetchedAt`);
      const cacheAge = cachedFetchedAt 
        ? Date.now() - parseInt(cachedFetchedAt, 10)
        : Infinity;
      
      // If cache is too old, clear it to force fresh fetch
      if (cacheAge > MAX_CACHE_AGE) {
        clearEquipmentDictionaryCache();
      }
      
      // Try to get cached ETag from localStorage (only if cache is not too old)
      const cachedEtag = cacheAge <= MAX_CACHE_AGE 
        ? localStorage.getItem(`${CACHE_KEY}-etag`)
        : undefined;
      
      const result = await fetchEquipmentDictionary(cachedEtag || undefined);
      
      if (result.isErr()) {
        const errorMsg = result.unwrapErr();
        
        if (errorMsg === "NOT_MODIFIED") {
          // Backend says data hasn't changed (304 Not Modified)
          // However, if user manually deleted equipment in Supabase, backend cache might be stale
          // If cache is older than FRESH_FETCH_THRESHOLD, force a fresh fetch to be safe
          if (cacheAge > FRESH_FETCH_THRESHOLD) {
            // Cache is getting old - force fresh fetch to ensure we have latest data
            // This handles the case where equipment was deleted directly in Supabase
            const freshResult = await fetchEquipmentDictionary(undefined);
            if (freshResult.isOk()) {
              return freshResult.unwrap();
            }
            // If fresh fetch fails, fall back to cached data
          }
          
          // Return cached version from localStorage (only if cache is not too old)
          if (cacheAge <= MAX_CACHE_AGE) {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
              return JSON.parse(cached) as EquipmentDictionarySnapshot;
            }
          }
          // If cache is too old or missing, force a fresh fetch by not sending ETag
          const freshResult = await fetchEquipmentDictionary(undefined);
          if (freshResult.isOk()) {
            return freshResult.unwrap();
          }
          throw new Error("Failed to fetch fresh equipment dictionary");
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
