/**
 * Unit tests for JSON export functionality
 */

import { describe, it, expect } from "vitest";
import { CarJson } from "../types/json-editor.types";

/**
 * Format JSON for export with stable key order
 */
function formatJsonForExport(json: CarJson): string {
  // Sort keys for stable output
  const sorted = Object.keys(json)
    .sort()
    .reduce((acc, key) => {
      acc[key] = json[key as keyof CarJson];
      return acc;
    }, {} as Record<string, unknown>);

  return JSON.stringify(sorted, null, 2);
}

describe("JSON Export", () => {
  it("should format JSON with 2-space indentation", () => {
    const json: CarJson = {
      id: "123",
      brand: "Toyota",
      model: "Camry",
      equipment: ["ABS", "GPS"],
    };

    const formatted = formatJsonForExport(json);
    const lines = formatted.split("\n");

    expect(lines[0]).toBe("{");
    expect(lines[1]).toBe('  "brand": "Toyota",');
    expect(lines[lines.length - 1]).toBe("}");
  });

  it("should sort keys alphabetically", () => {
    const json: CarJson = {
      equipment: ["ABS"],
      brand: "Toyota",
      id: "123",
      model: "Camry",
    };

    const formatted = formatJsonForExport(json);
    const parsed = JSON.parse(formatted);

    const keys = Object.keys(parsed);
    expect(keys).toEqual(["brand", "equipment", "id", "model"]);
  });

  it("should preserve array order", () => {
    const json: CarJson = {
      equipment: ["GPS", "ABS", "BLUETOOTH"],
    };

    const formatted = formatJsonForExport(json);
    const parsed = JSON.parse(formatted);

    expect(parsed.equipment).toEqual(["GPS", "ABS", "BLUETOOTH"]);
  });
});
