/**
 * Unit tests for equipment validation logic
 */

import { describe, it, expect } from "vitest";
import { EquipmentItem } from "../types/json-editor.types";

/**
 * Validate equipment codes against dictionary
 */
function validateEquipment(
  equipment: string[],
  dictionary: Record<string, EquipmentItem>
): Record<string, { status: "valid" | "unknown"; reason?: string }> {
  const result: Record<string, { status: "valid" | "unknown"; reason?: string }> = {};

  for (const code of equipment) {
    if (dictionary[code]) {
      result[code] = { status: "valid" };
    } else {
      result[code] = {
        status: "unknown",
        reason: "Not found in equipment dictionary",
      };
    }
  }

  return result;
}

describe("Equipment Validation", () => {
  const mockDictionary: Record<string, EquipmentItem> = {
    ABS: {
      id: "1",
      code: "ABS",
      name: "Anti-lock Braking System",
      category: "Safety",
    },
    GPS: {
      id: "2",
      code: "GPS",
      name: "Global Positioning System",
      category: "Technology",
    },
  };

  it("should validate known equipment codes", () => {
    const equipment = ["ABS", "GPS"];
    const result = validateEquipment(equipment, mockDictionary);

    expect(result["ABS"].status).toBe("valid");
    expect(result["GPS"].status).toBe("valid");
  });

  it("should mark unknown equipment codes", () => {
    const equipment = ["ABS", "UNKNOWN_CODE"];
    const result = validateEquipment(equipment, mockDictionary);

    expect(result["ABS"].status).toBe("valid");
    expect(result["UNKNOWN_CODE"].status).toBe("unknown");
    expect(result["UNKNOWN_CODE"].reason).toBe("Not found in equipment dictionary");
  });

  it("should handle empty equipment array", () => {
    const equipment: string[] = [];
    const result = validateEquipment(equipment, mockDictionary);

    expect(Object.keys(result)).toHaveLength(0);
  });

  it("should handle case-sensitive codes", () => {
    const equipment = ["abs", "ABS"];
    const result = validateEquipment(equipment, mockDictionary);

    expect(result["abs"].status).toBe("unknown");
    expect(result["ABS"].status).toBe("valid");
  });
});
