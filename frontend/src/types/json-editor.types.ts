/**
 * Types for the zero-lag JSON editor
 */

import { z } from "zod";

/**
 * Result type for error handling
 */
export class Result<T, E> {
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

  unwrapOr<S>(defaultValue: S): T | S {
    return this.type === "ok" ? (this.value as T) : defaultValue;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.type === "ok") {
      return Result.ok(fn(this.value as T));
    }
    return Result.err(this.value as E);
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    if (this.type === "err") {
      return Result.err(fn(this.value as E));
    }
    return Result.ok(this.value as T);
  }
}

/**
 * Car JSON schema - minimal but extensible
 */
export const CarJsonSchema = z.object({
  id: z.string().optional(),
  brand: z.string().optional(),
  model: z.string().optional(),
  equipment: z.array(z.string()).default([]),
  // Add other fields as needed, keeping it extensible
}).passthrough(); // Allow additional fields

export type CarJson = z.infer<typeof CarJsonSchema>;

/**
 * Equipment validation result
 */
export type EquipmentValidationStatus = "valid" | "unknown" | "custom";

export interface EquipmentValidationResult {
  code: string;
  status: EquipmentValidationStatus;
  reason?: string;
  suggestedMatches?: string[]; // Placeholder for future matching
}

/**
 * Patch/Diff model for tracking changes
 */
export interface JsonPatch {
  op: "add" | "remove" | "replace";
  path: string; // JSON path (e.g., "/equipment/0")
  value?: unknown;
  oldValue?: unknown;
}

export interface EditorState {
  originalJson: CarJson | null;
  workingJson: CarJson | null;
  originalHash: string | null;
  patches: JsonPatch[];
  validationState: Record<string, EquipmentValidationResult>;
  unknownEquipment: string[];
}

/**
 * Equipment dictionary snapshot from backend
 */
export interface EquipmentDictionarySnapshot {
  version: string;
  checksum: string;
  itemsByCode: Record<string, EquipmentItem>;
  mappingsByRawValue?: Record<string, string>; // Maps raw value (uppercase) to canonical code
  fetchedAt: number;
  stale?: boolean;
}

export interface EquipmentItem {
  id: string;
  code: string;
  name: string;
  category?: string;
  binCategory?: "bin_good" | "bin_trash";
}
