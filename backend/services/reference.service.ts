/**
 * Reference data service for equipment dictionary
 * Handles caching, ETag, and Supabase integration
 */

import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

interface CacheEntry {
  snapshot: EquipmentDictionarySnapshot;
  expiresAt: number;
}

interface EquipmentDictionarySnapshot {
  version: string;
  checksum: string;
  itemsByCode: Record<string, EquipmentItem>;
  mappingsByRawValue?: Record<string, string | string[]>; // Maps raw value (uppercase) to canonical code(s) - string for single, string[] for multi-mapping
  fetchedAt: number;
}

interface EquipmentItem {
  id: string;
  code: string;
  name: string;
  category?: string;
  binCategory?: "bin_good" | "bin_trash";
}

interface EquipmentReferenceResponse {
  version: string;
  checksum: string;
  itemsByCode: Record<string, EquipmentItem>;
  mappingsByRawValue?: Record<string, string | string[]>;
  fetchedAt: number;
  stale?: boolean;
}

/**
 * Result type for error handling
 */
class Result<T, E> {
  private constructor(
    private type: "ok" | "err",
    private value: T | E
  ) {}

  static ok<T, E>(value: T): Result<T, E> {
    return new Result<T, E>("ok", value);
  }

  static err<T, E>(error: E): Result<T, E> {
    return new Result<T, E>("err", error);
  }

  isOk(): boolean {
    return this.type === "ok";
  }

  isErr(): boolean {
    return this.type === "err";
  }

  unwrap(): T {
    if (this.type === "ok") {
      return this.value as T;
    }
    throw new Error(`Called unwrap on Err: ${String(this.value)}`);
  }

  unwrapErr(): E {
    if (this.type === "err") {
      return this.value as E;
    }
    throw new Error(`Called unwrapErr on Ok`);
  }
}

// In-memory cache
let cache: CacheEntry | null = null;
// Track CRUD frequency for adaptive TTL
let lastCRUDTime = 0;
let crudCount = 0;

// Adaptive TTL: Shorter TTL if recent CRUD, longer if stable
// This optimizes performance while maintaining freshness
function getCacheTTL(): number {
  const timeSinceLastCRUD = Date.now() - lastCRUDTime;
  
  // If no CRUD in last hour, increase TTL to 5 min (dictionary is stable)
  if (timeSinceLastCRUD > 60 * 60 * 1000 || lastCRUDTime === 0) {
    return 5 * 60 * 1000; // 5 minutes
  }
  
  // If recent CRUD, keep short TTL for freshness (multi-instance safety)
  return 2 * 60 * 1000; // 2 minutes
}

// Background refresh threshold (refresh when cache is 75% through TTL)
const REFRESH_THRESHOLD = 0.75;
let backgroundRefreshPromise: Promise<void> | null = null;

/**
 * Compute checksum for dictionary
 * Includes both itemsByCode and mappingsByRawValue to ensure ETag changes when mappings change
 */
function computeChecksum(
  itemsByCode: Record<string, EquipmentItem>,
  mappingsByRawValue?: Record<string, string | string[]>
): string {
  const sortedItems = Object.keys(itemsByCode)
    .sort()
    .map((code) => `${code}:${itemsByCode[code].name}`)
    .join("|");

  const sortedMappings = mappingsByRawValue
    ? Object.keys(mappingsByRawValue)
        .sort()
        .map((raw) => {
          const mapping = mappingsByRawValue![raw];
          // Handle both string (single) and string[] (multi-mapping)
          const mappingStr = Array.isArray(mapping) ? mapping.join(",") : mapping;
          return `${raw}:${mappingStr}`;
        })
        .join("|")
    : "";

  const combined = `${sortedItems}|${sortedMappings}`;
  return crypto.createHash("sha256").update(combined).digest("hex").substring(0, 16);
}

/**
 * Fetch equipment dictionary from Supabase
 */
async function fetchFromSupabase(): Promise<Result<EquipmentDictionarySnapshot, string>> {
  try {
    const equipment = await prisma.equipment.findMany({
      where: {
        binCategory: "bin_good", // Only fetch approved equipment
      },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        binCategory: true,
      },
    });

    const itemsByCode: Record<string, EquipmentItem> = {};
    
    for (const item of equipment) {
      const code = item.code || item.name.toUpperCase().replace(/\s+/g, "_");
      itemsByCode[code] = {
        id: item.id,
        code,
        name: item.name,
        category: item.category || undefined,
        binCategory: item.binCategory || undefined,
      };
    }

    // Fetch equipment mappings (raw value -> canonical code)
    // IMPORTANT: Only include mappings to bin_good equipment to ensure checksum correctness
    // Mappings to trash equipment should not appear in the snapshot (equipment not in itemsByCode)
    const mappings = await prisma.equipmentMapping.findMany({
      where: {
        OR: [
          {
            equipment: {
              binCategory: "bin_good", // Single mappings to valid equipment
            },
          },
          {
            equipmentId: null, // Multi-mappings (equipmentId is null, equipmentIds is used)
          },
        ],
      },
      include: {
        equipment: {
          select: {
            code: true,
            name: true,
            binCategory: true, // Ensure binCategory is selected for filtering
          },
        },
      },
    });

    const mappingsByRawValue: Record<string, string | string[]> = {};
    for (const mapping of mappings) {
      const rawValueUpper = mapping.rawValue.toUpperCase();
      
      // Handle multi-mapping (equipmentIds JSONB array)
      if (mapping.equipmentIds && Array.isArray(mapping.equipmentIds)) {
        const equipmentIds = mapping.equipmentIds as string[];
        // Fetch all equipment items for multi-mapping
        const equipmentItems = await prisma.equipment.findMany({
          where: {
            id: { in: equipmentIds },
            binCategory: "bin_good",
          },
          select: { name: true },
        });
        
        // Store as array of names for multi-mapping
        const equipmentNames = equipmentItems.map(e => e.name);
        if (equipmentNames.length > 0) {
          mappingsByRawValue[rawValueUpper] = equipmentNames;
          
          // Also create mapping for underscore version
          const underscoreVersion = rawValueUpper.replace(/[\s\-]/g, "_");
          if (underscoreVersion !== rawValueUpper) {
            mappingsByRawValue[underscoreVersion] = equipmentNames;
          }
        }
      }
      // Handle single mapping (backward compatibility)
      else if (mapping.equipment && mapping.equipment.binCategory === "bin_good") {
        // Map to equipment name (not code) - name is what should appear in JSON
        const equipmentName = mapping.equipment.name;
        
        // Store mapping: raw value -> equipment name
        mappingsByRawValue[rawValueUpper] = equipmentName;
        
        // Also create mapping for underscore version if raw value has spaces/hyphens
        // This handles cases where JSON has "12_VOLT_SOCKET" but DB has "12-VOLT SOCKET"
        const underscoreVersion = rawValueUpper.replace(/[\s\-]/g, "_");
        if (underscoreVersion !== rawValueUpper) {
          mappingsByRawValue[underscoreVersion] = equipmentName;
        }
      }
    }

    const checksum = computeChecksum(itemsByCode, mappingsByRawValue);
    const version = `${Date.now()}`;
    const fetchedAt = Date.now();

    return Result.ok({
      version,
      checksum,
      itemsByCode,
      mappingsByRawValue,
      fetchedAt,
    });
  } catch (error) {
    return Result.err(
      `Failed to fetch equipment from Supabase: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get equipment dictionary with caching
 * Implements stale-while-revalidate pattern for multi-instance safety:
 * - Cache has short TTL (2 min) to limit staleness across instances
 * - Invalidation is immediate on local instance (CRUD operations)
 * - Other instances will refresh within TTL window
 */
export async function getEquipmentDictionary(
  ifNoneMatch?: string
): Promise<Result<EquipmentReferenceResponse, string>> {
  const now = Date.now();
  let stale = false;

  // Check cache validity
  if (cache && cache.expiresAt > now) {
    // Cache is valid - check if we should refresh in background
    const cacheAge = now - cache.snapshot.fetchedAt;
    const cacheTTL = cache.expiresAt - cache.snapshot.fetchedAt;
    
    // Background refresh: If cache is 75% through TTL, refresh in background (non-blocking)
    if (cacheAge > cacheTTL * REFRESH_THRESHOLD && !backgroundRefreshPromise) {
      backgroundRefreshPromise = fetchFromSupabase().then(result => {
        if (result.isOk()) {
          const newSnapshot = result.unwrap();
          const newTTL = getCacheTTL();
          cache = {
            snapshot: newSnapshot,
            expiresAt: Date.now() + newTTL,
          };
          if (process.env.NODE_ENV === "development") {
            console.log("[EquipmentDictionary] Background refresh completed: checksum", newSnapshot.checksum.substring(0, 8));
          }
        }
        backgroundRefreshPromise = null;
      }).catch(() => {
        backgroundRefreshPromise = null;
      });
    }
    
    // Return current cache immediately (non-blocking)
    if (ifNoneMatch === cache.snapshot.checksum) {
      // Client has same version, return 304 equivalent (empty response)
      // Diagnostic: cache hit with matching ETag
      if (process.env.NODE_ENV === "development") {
        console.log("[EquipmentDictionary] Cache hit (304): checksum", cache.snapshot.checksum.substring(0, 8));
      }
      return Result.ok({
        ...cache.snapshot,
        stale: false,
      });
    }
    // Cache hit but different ETag (client has stale data)
    if (process.env.NODE_ENV === "development") {
      console.log("[EquipmentDictionary] Cache hit (200): checksum", cache.snapshot.checksum.substring(0, 8), "age", Math.round(cacheAge / 1000), "s");
    }
    return Result.ok({
      ...cache.snapshot,
      stale: false,
    });
  }

  // Cache expired or missing, fetch from Supabase
  const fetchStart = Date.now();
  const fetchResult = await fetchFromSupabase();

  if (fetchResult.isErr()) {
    // Supabase fetch failed
    if (cache) {
      // Serve stale cache with warning (stale-while-revalidate)
      stale = true;
      if (process.env.NODE_ENV === "development") {
        console.warn("[EquipmentDictionary] Serving stale cache (DB fetch failed):", fetchResult.unwrapErr());
      }
      return Result.ok({
        ...cache.snapshot,
        stale: true,
      });
    }
    // No cache available, return error
    return Result.err(fetchResult.unwrapErr());
  }

  const snapshot = fetchResult.unwrap();
  const fetchDuration = Date.now() - fetchStart;
  const ttl = getCacheTTL();
  
  // Diagnostic logging for cache freshness validation
  if (process.env.NODE_ENV === "development") {
    console.log("[EquipmentDictionary] Cache refreshed:", {
      checksum: snapshot.checksum.substring(0, 8),
      itemsCount: Object.keys(snapshot.itemsByCode).length,
      mappingsCount: Object.keys(snapshot.mappingsByRawValue || {}).length,
      fetchMs: fetchDuration,
      ttlMinutes: Math.round(ttl / 60000),
      cacheSource: cache ? (cache.expiresAt <= now ? "expired" : "invalidated") : "miss",
      timeSinceLastCRUD: lastCRUDTime > 0 ? Math.round((now - lastCRUDTime) / 1000) + "s" : "never",
    });
  }
  
  // Update cache with adaptive TTL
  cache = {
    snapshot,
    expiresAt: now + ttl,
  };

  return Result.ok({
    ...snapshot,
    stale: false,
  });
}

/**
 * Invalidate equipment dictionary cache
 * Call this after CRUD operations (create equipment, create mapping, mark as trash, etc.)
 * to ensure next request fetches fresh data from database
 * 
 * NOTE: This only invalidates cache on the local instance.
 * For multi-instance deployments, rely on adaptive TTL for eventual consistency.
 */
export function invalidateEquipmentDictionaryCache(): void {
  const hadCache = cache !== null;
  cache = null;
  lastCRUDTime = Date.now();
  crudCount++;
  
  // Cancel any pending background refresh
  backgroundRefreshPromise = null;
  
  // Diagnostic logging for cache invalidation tracking
  if (process.env.NODE_ENV === "development" && hadCache) {
    console.log("[EquipmentDictionary] Cache invalidated (CRUD operation)", {
      crudCount,
      timeSinceLastCRUD: "0s",
    });
  }
}

/**
 * Warm up cache on server start
 * Pre-populates cache to reduce first request latency
 */
export async function warmupEquipmentDictionaryCache(): Promise<void> {
  try {
    const result = await fetchFromSupabase();
    if (result.isOk()) {
      const snapshot = result.unwrap();
      const ttl = getCacheTTL();
      cache = {
        snapshot,
        expiresAt: Date.now() + ttl,
      };
      if (process.env.NODE_ENV === "development") {
        console.log("[EquipmentDictionary] Cache warmed up:", {
          checksum: snapshot.checksum.substring(0, 8),
          itemsCount: Object.keys(snapshot.itemsByCode).length,
          mappingsCount: Object.keys(snapshot.mappingsByRawValue || {}).length,
        });
      }
    }
  } catch (error) {
    // Silent fail - cache will be populated on first request
    if (process.env.NODE_ENV === "development") {
      console.warn("[EquipmentDictionary] Cache warmup failed:", error);
    }
  }
}
