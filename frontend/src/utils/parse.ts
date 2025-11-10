import { Result } from "../libs/result/index.mjs";
import { CarListing } from "../libs/catalog/index.mjs";

export function parseCarListing(json: any): CarListing | undefined {
  try {
    // Process equipment field specifically
    let equipmentResult;
    if (json.data && json.data.equipment) {
      // Handle different equipment formats
      if (
        json.data.equipment.type === "ok" &&
        Array.isArray(json.data.equipment.value)
      ) {
        // Format: { type: "ok", value: [] }
        // Create proper Result instances for each equipment item
        const equipmentItems = json.data.equipment.value.map((item: any) => {
          if (item.type === "ok") {
            return Result.ok(item.value);
          } else if (item.type === "err") {
            return Result.err(item.value);
          } else {
            return Result.ok(item.value);
          }
        });

        equipmentResult = Result.ok(equipmentItems);
      } else if (json.data.equipment.value) {
        // Format: { value: [] }
        const equipmentItems = Array.isArray(json.data.equipment.value)
          ? json.data.equipment.value.map((item: any) => {
              if (typeof item === "object" && "type" in item) {
                return item.type === "ok"
                  ? Result.ok(item.value)
                  : Result.err(item.value);
              } else {
                return Result.ok(item);
              }
            })
          : [];

        equipmentResult = Result.ok(equipmentItems);
      } else {
        // Default empty array
        equipmentResult = Result.ok([]);
      }
    } else {
      // No equipment data
      equipmentResult = Result.ok([]);
    }

    // Create a copy of the json to modify
    const parsedJson = { ...json };

    // Convert all Result-like objects to proper Result instances
    if (parsedJson.data) {
      const data = { ...parsedJson.data };

      // Convert each field in data that has a Result-like structure
      Object.entries(data).forEach(([key, value]) => {
        if (key !== "equipment") {
          // We already handled equipment specially
          if (value && typeof value === "object") {
            if ("type" in value) {
              if (value.type === "ok" && "value" in value) {
                data[key] = Result.ok(value.value);
              } else if (value.type === "err") {
                data[key] =
                  "value" in value ? Result.err(value.value) : Result.err();
              }
            }
          }
        }
      });

      // Apply the equipment result we created earlier
      data.equipment = equipmentResult;

      parsedJson.data = data;
    }

    return parsedJson as CarListing;
  } catch (error) {
    console.error("Error parsing car listing:", error);
    return undefined;
  }
}
