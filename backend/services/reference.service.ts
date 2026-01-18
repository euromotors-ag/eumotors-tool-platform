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
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Compute checksum for dictionary
 */
function computeChecksum(itemsByCode: Record<string, EquipmentItem>): string {
  const sorted = Object.keys(itemsByCode)
    .sort()
    .map((code) => `${code}:${itemsByCode[code].name}`)
    .join("|");
  return crypto.createHash("sha256").update(sorted).digest("hex").substring(0, 16);
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

    const checksum = computeChecksum(itemsByCode);
    const version = `${Date.now()}`;
    const fetchedAt = Date.now();

    return Result.ok({
      version,
      checksum,
      itemsByCode,
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
 */
export async function getEquipmentDictionary(
  ifNoneMatch?: string
): Promise<Result<EquipmentReferenceResponse, string>> {
  const now = Date.now();
  let stale = false;

  // Check cache validity
  if (cache && cache.expiresAt > now) {
    // Cache is valid
    if (ifNoneMatch === cache.snapshot.checksum) {
      // Client has same version, return 304 equivalent (empty response)
      return Result.ok({
        ...cache.snapshot,
        stale: false,
      });
    }
    return Result.ok({
      ...cache.snapshot,
      stale: false,
    });
  }

  // Cache expired or missing, fetch from Supabase
  const fetchResult = await fetchFromSupabase();

  if (fetchResult.isErr()) {
    // Supabase fetch failed
    if (cache) {
      // Serve stale cache with warning
      stale = true;
      return Result.ok({
        ...cache.snapshot,
        stale: true,
      });
    }
    // No cache available, return error
    return Result.err(fetchResult.unwrapErr());
  }

  const snapshot = fetchResult.unwrap();
  
  // Update cache
  cache = {
    snapshot,
    expiresAt: now + CACHE_TTL_MS,
  };

  return Result.ok({
    ...snapshot,
    stale: false,
  });
}
