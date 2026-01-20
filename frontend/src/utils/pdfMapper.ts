import type { ExtractedTextData } from "./pdfExtractor";
import { v4 as uuidv4 } from "uuid";
import { Buffer } from "buffer";
import {
  EQUIPMENT_CODE_MAP,
  EQUIPMENT_CODE_TRASH_BIN,
} from "./equipment-code-map";

/**
 * Generates a unique ID using UUID v4 and converts it to base64
 * Same process as in the scraping project: uuidv4() → Buffer.from(...) → .toString("base64")
 */
function generateUniqueId(): string {
  const uuid = uuidv4(); // → "550e8400-e29b-41d4-a716-446655440000"
  return Buffer.from(uuid).toString("base64");
}

export interface MappingRule {
  key: string;
  pattern?: string | RegExp; // Optional for rules that only use defaultValue
  extractValue?: (match: RegExpMatchArray) => string;
  defaultValue?: string;
  transform?: (value: string) => unknown; // Transform function for type conversion
}

export interface JsonTemplate {
  [key: string]: unknown;
}

/**
 * Extracts values from PDF text based on patterns
 */
function extractValueFromText(
  text: string,
  pattern: string | RegExp
): string | null {
  // Convert string pattern to RegExp if needed
  const regex =
    typeof pattern === "string" ? new RegExp(pattern, "i") : pattern;

  const match = text.match(regex);

  if (!match) return null;

  // If pattern has a capture group, return that (trimmed)
  if (match.length > 1 && match[1]) {
    const value = match[1].trim();
    // Clean up value - remove trailing spaces and common separators
    return value.replace(/\s{2,}.*$/, "").trim();
  }

  // If no capture group but we have a match, try to extract value after the pattern
  const fullMatch = match[0];
  const matchIndex = text.indexOf(fullMatch);

  if (matchIndex === -1) return null;

  // Get text after the match
  const afterMatch = text.substring(matchIndex + fullMatch.length);

  // Try to find the value - skip whitespace, then capture until we hit 2+ spaces followed by capital letter (next field)
  // or end of text
  const valueMatch = afterMatch.match(
    /^\s*([^\n\r]+?)(?=\s{2,}[A-Z][a-z]|\s{2,}[A-Z]{2,}|\s{2,}\d{4}|\s{2,}EUR|\s{2,}Yes|\s{2,}No|$)/
  );

  if (valueMatch && valueMatch[1]) {
    return valueMatch[1].trim();
  }

  return null;
}

/**
 * Maps PDF text to a JSON template structure
 */
export function mapPdfToJson(
  pdfData: ExtractedTextData,
  template: JsonTemplate,
  mappingRules: MappingRule[]
): JsonTemplate {
  const fullText = pdfData.fullText;
  const result: JsonTemplate = JSON.parse(JSON.stringify(template)); // Deep clone template

  // Apply mapping rules
  for (const rule of mappingRules) {
    if (!rule.pattern) {
      // Rule without pattern - only use defaultValue
      if (rule.defaultValue !== undefined) {
        const defaultValue =
          rule.transform && rule.defaultValue
            ? rule.transform(rule.defaultValue)
            : rule.defaultValue;
        setNestedValue(result, rule.key, defaultValue);
      }
      continue;
    }

    const rawValue = extractValueFromText(fullText, rule.pattern);

    if (rawValue) {
      // Apply transform if provided
      const value = rule.transform ? rule.transform(rawValue) : rawValue;

      // Check if we're working with the new listing structure (has type/value)
      const keys = rule.key.split(".");
      let current: JsonTemplate = result;
      let isListingStructure = false;

      for (let i = 0; i < keys.length - 1; i++) {
        const keyValue = current[keys[i]];
        if (
          keyValue &&
          typeof keyValue === "object" &&
          keyValue !== null &&
          "type" in keyValue
        ) {
          isListingStructure = true;
          break;
        }
        current = keyValue as JsonTemplate;
      }

      const finalKeyValue = current[keys[keys.length - 1]];
      if (
        isListingStructure ||
        (finalKeyValue &&
          typeof finalKeyValue === "object" &&
          finalKeyValue !== null &&
          "type" in finalKeyValue)
      ) {
        // Use new structure with type/value
        setNestedValueWithType(result, rule.key, value, "ok");
      } else {
        // Use old structure (direct value)
        setNestedValue(result, rule.key, value);
      }
    } else if (rule.defaultValue !== undefined) {
      const defaultValue =
        rule.transform && rule.defaultValue
          ? rule.transform(rule.defaultValue)
          : rule.defaultValue;
      setNestedValue(result, rule.key, defaultValue);
    }
  }

  return result;
}

/**
 * Debug function to test patterns against text
 */
export function debugPatternMatching(
  text: string,
  mappingRules: MappingRule[]
): Array<{
  key: string;
  matched: boolean;
  value: string | null;
  pattern: string;
}> {
  return mappingRules.map((rule) => {
    if (!rule.pattern) {
      return {
        key: rule.key,
        matched: false,
        value: null,
        pattern: "(no pattern)",
      };
    }
    const value = extractValueFromText(text, rule.pattern);
    return {
      key: rule.key,
      matched: value !== null,
      value: value,
      pattern:
        typeof rule.pattern === "string"
          ? rule.pattern
          : rule.pattern.toString(),
    };
  });
}

/**
 * Sets a nested value in an object using dot notation
 */
function setNestedValue(obj: JsonTemplate, path: string, value: unknown): void {
  const keys = path.split(".");
  let current: JsonTemplate = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (
      !(key in current) ||
      typeof current[key] !== "object" ||
      current[key] === null
    ) {
      current[key] = {};
    }
    current = current[key] as JsonTemplate;
  }

  current[keys[keys.length - 1]] = value;
}

/**
 * Checks if a value is empty/unknown/null/none
 */
function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") {
    const trimmed = value.trim().toLowerCase();
    return (
      trimmed === "" ||
      trimmed === "unknown" ||
      trimmed === "null" ||
      trimmed === "none" ||
      trimmed === "blank"
    );
  }
  return false;
}

/**
 * Sets a nested value directly - handles paths like "data.brand.value" where
 * "data.brand" is already {type: "ok", value: ""} and we just want to set the value
 * If value is empty/unknown/null/none, sets type to "err" instead
 */
function setNestedValueDirect(
  obj: JsonTemplate,
  path: string,
  value: unknown
): void {
  const keys = path.split(".");
  let current: JsonTemplate = obj;

  // Navigate to the parent object
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (
      !(key in current) ||
      typeof current[key] !== "object" ||
      current[key] === null
    ) {
      current[key] = {};
    }
    current = current[key] as JsonTemplate;
  }

  const finalKey = keys[keys.length - 1];

  // Special handling: if the final key is "value" and the parent is already {type: "ok", value: ""}
  // then we should update the value directly
  if (finalKey === "value" && keys.length > 1) {
    const parentKey = keys[keys.length - 2];
    const parentValue = current[parentKey];

    if (
      parentValue &&
      typeof parentValue === "object" &&
      parentValue !== null &&
      "type" in parentValue
    ) {
      // Parent is already {type: "ok", value: ""}, just update the value directly
      const parentObj = parentValue as { type: string; value: unknown };

      // Check if value is empty/unknown/null/none
      if (isEmptyValue(value)) {
        // Set type to "err" and remove value
        parentObj.type = "err";
        delete parentObj.value;
        return;
      }

      // If value is already nested, extract it
      if (
        parentObj.value &&
        typeof parentObj.value === "object" &&
        parentObj.value !== null &&
        "type" in parentObj.value &&
        "value" in parentObj.value
      ) {
        // Value is nested, extract the inner value
        const nestedObj = parentObj.value as { type: string; value: unknown };
        parentObj.value =
          nestedObj.value !== undefined ? nestedObj.value : value;
      } else {
        parentObj.value = value;
      }
      parentObj.type = "ok";
      return;
    }
  }

  // For price_b2c.value, price_b2c.currency, price_b2b.value, price_b2b.currency, set directly (not nested in type/value)
  if (
    keys.length >= 2 &&
    (keys[keys.length - 2] === "price_b2c" ||
      keys[keys.length - 2] === "price_b2b")
  ) {
    current[finalKey] = value;
    return;
  }

  // Regular handling for other cases - set directly
  current[finalKey] = value;
}

/**
 * Sets a nested value with {type: "ok", value: ...} structure
 * Used for creating new type/value structures
 */
function setNestedValueWithType(
  obj: JsonTemplate,
  path: string,
  value: unknown,
  type: "ok" | "err" = "ok"
): void {
  const keys = path.split(".");
  let current: JsonTemplate = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (
      !(key in current) ||
      typeof current[key] !== "object" ||
      current[key] === null
    ) {
      current[key] = {};
    }
    current = current[key] as JsonTemplate;
  }

  const finalKey = keys[keys.length - 1];
  const existingValue = current[finalKey];
  if (
    existingValue &&
    typeof existingValue === "object" &&
    existingValue !== null &&
    "type" in existingValue
  ) {
    // Update existing structure
    (existingValue as { type: string; value: unknown }).type = type;
    (existingValue as { type: string; value: unknown }).value = value;
  } else {
    // Create new structure
    current[finalKey] = { type, value };
  }
}

/**
 * Creates default mapping rules for common patterns
 */
export function createDefaultMappingRules(): MappingRule[] {
  return [
    {
      key: "namn",
      pattern: /Namn:\s*([^\n\r]+)/i,
    },
    {
      key: "bil",
      pattern: /Bil:\s*([^\n\r]+)/i,
    },
    {
      key: "märke",
      pattern: /Märke:\s*([^\n\r]+)/i,
    },
  ];
}

/**
 * Creates a default JSON template
 */
export function createDefaultTemplate(): JsonTemplate {
  return {
    namn: "",
    bil: "",
    märke: "",
  };
}

/**
 * Creates vehicle template for vehicle data extraction
 */
export function createVehicleTemplate(): JsonTemplate {
  return {
    vehicleId: "",
    manufacturer: "",
    model: "",
    vin: "",
    modelCode: "",
    modelYear: "",
    fuelType: "",
    powerKw: "",
    powerHp: "",
    mileage: "",
    price: {
      fixedPrice: "",
      offerPrice: "",
      sellingPrice: "",
      recommendedRetailPrice: "",
    },
    location: {
      country: "",
      zipCode: "",
      city: "",
    },
    dates: {
      productionDate: "",
      deliveryDate: "",
      regDate: "",
    },
    condition: {
      damages: "",
      availability: "",
      paymentReceived: "",
      registrationDocument: "",
    },
  };
}

/**
 * Creates vehicle mapping rules for extracting vehicle data from PDFs
 */
export function createVehicleMappingRules(): MappingRule[] {
  return [
    {
      key: "vehicleId",
      pattern: "Vehicle\\s+(\\d+)",
      defaultValue: "",
    },
    {
      key: "manufacturer",
      pattern: "Manufacturer\\s{2,}([A-Za-z]+)\\s{2,}Model",
      defaultValue: "",
    },
    {
      key: "model",
      pattern: "Model\\s{2,}([^\\n\\r]+?)\\s{2,}Model Code",
      defaultValue: "",
    },
    {
      key: "vin",
      pattern: "Vehicle Identification Number \\(VIN\\)\\s{2,}([A-Z0-9]{17})",
      defaultValue: "",
    },
    {
      key: "modelCode",
      pattern: "Model Code\\s{2,}([A-Z0-9]+)\\s{2,}Vehicle Identification",
      defaultValue: "",
    },
    {
      key: "modelYear",
      pattern: "Model Year\\s{2,}(\\d{4})\\s{2,}Origin",
      defaultValue: "",
    },
    {
      key: "fuelType",
      pattern: "Fuel Type\\s{2,}([^\\n\\r]+?)\\s{2,}Type",
      defaultValue: "",
    },
    {
      key: "powerKw",
      pattern: "Power kW\\s{2,}(\\d+)\\s*kW",
      defaultValue: "",
    },
    {
      key: "powerHp",
      pattern: "Power HP\\s{2,}(\\d+)\\s*PS",
      defaultValue: "",
    },
    {
      key: "mileage",
      pattern:
        "Mileage according to odometer\\s{2,}([^\\n\\r]+?)\\s{2,}Last Service",
      defaultValue: "",
    },
    {
      key: "price.offerPrice",
      pattern: "Offer Price\\s{2,}EUR([\\d,]+\\.[\\d]+)",
      defaultValue: "",
    },
    {
      key: "price.sellingPrice",
      pattern: "Selling Price\\s{2,}EUR([\\d,]+\\.[\\d]+)",
      defaultValue: "",
    },
    {
      key: "price.recommendedRetailPrice",
      pattern: "Recommended Retail Price \\(Net\\)\\s{2,}EUR([\\d,]+\\.[\\d]+)",
      defaultValue: "",
    },
    {
      key: "location.country",
      pattern: "Country\\s{2,}([A-Z]{2})\\s{2,}ZIP Code",
      defaultValue: "",
    },
    {
      key: "location.zipCode",
      pattern: "ZIP Code\\s{2,}(\\d+)\\s{2,}City",
      defaultValue: "",
    },
    {
      key: "location.city",
      pattern: "City\\s{2,}([^\\n\\r]+?)\\s{2,}Reg\\. Date",
      defaultValue: "",
    },
    {
      key: "dates.productionDate",
      pattern: "Production Date\\s{2,}([^\\n\\r]+?)\\s{2,}General Inspection",
      defaultValue: "",
    },
    {
      key: "dates.deliveryDate",
      pattern: "Delivery date\\s{2,}([^\\n\\r]+?)\\s{2,}Production Date",
      defaultValue: "",
    },
    {
      key: "dates.regDate",
      pattern: "Reg\\. Date\\s{2,}([^\\n\\r]+?)\\s{2,}Delivery date",
      defaultValue: "",
    },
    {
      key: "condition.damages",
      pattern: "Damages\\s{2,}EUR([\\d,]+\\.[\\d]+)",
      defaultValue: "",
    },
    {
      key: "condition.availability",
      pattern: "Availability\\s{2,}([^\\n\\r]+?)\\s{2,}Payment Received",
      defaultValue: "",
    },
    {
      key: "condition.paymentReceived",
      pattern: "Payment Received\\s{2,}(Yes|No)",
      defaultValue: "",
    },
    {
      key: "condition.registrationDocument",
      pattern: "Registration Document\\s{2,}(Yes|No)",
      defaultValue: "",
    },
  ];
}

/**
 * Creates listing template matching the database structure exactly
 */
export function createListingTemplate(): JsonTemplate {
  return {
    id: "",
    images: [],
    price_b2b: {
      value: "",
      currency: "CHF",
    },
    price_b2c: {
      value: "",
      currency: "CHF",
    },
    data: {
      vin: {
        type: "err",
      },
      brand: {
        type: "ok",
        value: "",
      },
      model: {
        type: "ok",
        value: "",
      },
      fuel_type: {
        type: "ok",
        value: "",
      },
      body_type: {
        type: "ok",
        value: "",
      },
      drive_type: {
        type: "ok",
        value: "",
      },
      transmission_type: {
        type: "ok",
        value: "",
      },
      exterior_color: {
        type: "ok",
        value: "",
      },
      interior_color: {
        type: "err",
      },
      interior_material: {
        type: "ok",
        value: "",
      },
      energy_efficiency: {
        type: "ok",
        value: "",
      },
      euro_norm: {
        type: "ok",
        value: "",
      },
      equipment: {
        type: "err",
        value: [],
      },
      seats: {
        type: "ok",
        value: "",
      },
      doors: {
        type: "ok",
        value: "",
      },
      cylinders: {
        type: "ok",
        value: "",
      },
      co2_emission_g_km: {
        type: "ok",
        value: "",
      },
      power_hp: {
        type: "ok",
        value: "",
      },
      mileage_km: {
        type: "ok",
        value: "",
      },
      cubic_capacity_cm3: {
        type: "ok",
        value: "",
      },
      empty_weight_kg: {
        type: "ok",
        value: "",
      },
      fuel_consumption_l_100km: {
        type: "ok",
        value: "",
      },
      registration_date: {
        type: "ok",
        value: [],
      },
    },
    comparison_link: "",
    comparison_price: {
      value: "",
      currency: "CHF",
    },
    comparison_text: "",
    comment: "",
    trim: "",
    unique: "",
    dealer_phone: "",
    dealer_email: "",
  };
}

/**
 * Extracts equipment codes from PDF text and uses descriptions directly from PDF
 * Filters out codes that are in the trash bin
 */
function extractEquipmentCodes(
  text: string
): Array<{ type: "err"; value: string }> {
  const equipment: Array<{ type: "err"; value: string }> = [];

  // Pattern to match equipment codes: CODE followed by 2+ spaces and description
  // Format: "AV1   Driving on the right" or "AV1   Driving on the right  A8C   Comfort"
  // Look for "Equipments" or "Equipments" section
  const equipmentSectionMatch = text.match(
    /Equipments?\s{2,}(.+?)(?=\s{2,}Wheels|$)/is
  );
  if (!equipmentSectionMatch) {
    return equipment;
  }

  const equipmentSection = equipmentSectionMatch[1];

  // Match codes with descriptions: CODE followed by 2+ spaces and description
  // Pattern: CODE   Description (until next CODE or end)
  const codePattern =
    /\b([A-Z0-9]{2,4})\s{2,}([^\n\r]+?)(?=\s{2,}[A-Z0-9]{2,4}\s{2,}|\s{2,}Wheels|$)/g;
  const foundCodes = new Set<string>();

  let match;
  while ((match = codePattern.exec(equipmentSection)) !== null) {
    const code = match[1].trim();
    const description = match[2].trim();

    // Skip if code is in trash bin
    if (EQUIPMENT_CODE_TRASH_BIN.has(code)) {
      continue;
    }

    // Skip if we've already found this code (avoid duplicates)
    if (foundCodes.has(code)) {
      continue;
    }

    // Only add if we have both code and description
    if (code && description) {
      foundCodes.add(code);
      // Clean up description: remove extra whitespace and trailing separators
      const cleanDescription = description
        .replace(/\s{2,}.*$/, "") // Remove trailing content after 2+ spaces
        .trim()
        .toUpperCase(); // Normalize to uppercase

      equipment.push({
        type: "err",
        value: cleanDescription,
      });
    }
  }

  return equipment;
}

/**
 * Finds equipment codes in text that are not in EQUIPMENT_CODE_MAP
 * Useful for identifying new codes or codes that might need to be added to trash bin
 * Returns an array of objects with code and description
 *
 * NOTE: Since we now extract descriptions directly from PDFs, this function is mainly
 * useful for debugging and identifying codes that should be added to trash bin.
 */
export function findMissingEquipmentCodes(
  text: string
): Array<{ code: string; description: string }> {
  const missingCodes: Array<{ code: string; description: string }> = [];

  // Look for "Equipments" or "Equipments" section
  const equipmentSectionMatch = text.match(
    /Equipments?\s{2,}(.+?)(?=\s{2,}Wheels|$)/is
  );
  if (!equipmentSectionMatch) {
    return missingCodes;
  }

  const equipmentSection = equipmentSectionMatch[1];

  // Match codes: 2-4 alphanumeric characters followed by 2+ spaces and description
  // Pattern: CODE   Description
  const codePattern =
    /\b([A-Z0-9]{2,4})\s{2,}([^\n\r]+?)(?=\s{2,}[A-Z0-9]{2,4}\s{2,}|\s{2,}Wheels|$)/g;
  const foundCodes = new Set<string>();

  let match;
  while ((match = codePattern.exec(equipmentSection)) !== null) {
    const code = match[1].trim();
    const description = match[2].trim();

    // Skip if code is already in our map or we've already found it
    // Also skip if it's in trash bin
    if (
      !EQUIPMENT_CODE_MAP[code] &&
      !EQUIPMENT_CODE_TRASH_BIN.has(code) &&
      !foundCodes.has(code) &&
      code &&
      description
    ) {
      foundCodes.add(code);
      missingCodes.push({
        code,
        description: description.replace(/\s{2,}.*$/, "").trim(), // Clean up description
      });
    }
  }

  return missingCodes;
}

/**
 * Parses date string to [year, month, day] format
 * Handles formats like "6/6/25", "12/19/25", "3/4/25"
 */
function parseDate(
  dateStr: string
): [number, number | null, number | null] | null {
  if (!dateStr || dateStr.toLowerCase() === "unknown") {
    return null;
  }

  // Match formats: M/D/YY or MM/DD/YY
  const dateMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!dateMatch) {
    return null;
  }

  const month = parseInt(dateMatch[1], 10);
  const day = parseInt(dateMatch[2], 10);
  let year = parseInt(dateMatch[3], 10);

  // Convert 2-digit year to 4-digit (assuming 2000s)
  if (year < 100) {
    year = 2000 + year;
  }

  // Month is 1-indexed in the date string, but we keep it as-is for the array
  return [year, month, day];
}

/**
 * Converts fuel type to uppercase format
 */
function normalizeFuelType(fuelType: string): string {
  if (!fuelType) return "";
  const upper = fuelType.toUpperCase().trim();

  // Map common variations
  if (upper.includes("DIESEL")) return "DIESEL";
  if (
    upper.includes("BENZIN") ||
    upper.includes("PETROL") ||
    upper.includes("GASOLINE")
  )
    return "BENZIN";
  if (upper.includes("ELECTRIC")) return "ELECTRIC";
  if (upper.includes("HYBRID")) return "HYBRID";

  return upper;
}

/**
 * Converts body type to uppercase format
 */
function normalizeBodyType(bodyType: string): string {
  if (!bodyType) return "";
  const upper = bodyType.toUpperCase().trim();

  // Map common variations
  if (
    upper.includes("STATION WAGON") ||
    upper.includes("KOMBI") ||
    upper.includes("ESTATE")
  )
    return "STATION WAGON";
  if (upper.includes("SUV")) return "SUV";
  if (upper.includes("SEDAN") || upper.includes("LIMOUSINE")) return "SEDAN";
  if (upper.includes("COUPE")) return "COUPE";
  if (upper.includes("CONVERTIBLE")) return "CONVERTIBLE";
  if (upper.includes("HATCHBACK")) return "HATCHBACK";

  return upper;
}

/**
 * Converts transmission type to uppercase format
 */
function normalizeTransmissionType(transmission: string): string {
  if (!transmission) return "";
  const upper = transmission.toUpperCase().trim();

  if (upper.includes("AUTOMATIC") || upper.includes("AUTO")) return "AUTOMATIC";
  if (upper.includes("MANUAL")) return "MANUAL";
  if (upper.includes("CVT")) return "CVT";

  return upper;
}

/**
 * Converts color to uppercase format
 */
function normalizeColor(color: string): string {
  if (!color) return "";
  const upper = color.toUpperCase().trim();

  if (upper.includes("BLACK")) return "BLACK";
  if (upper.includes("WHITE")) return "WHITE";
  if (upper.includes("SILVER")) return "SILVER";
  if (upper.includes("GRAY") || upper.includes("GREY")) return "GRAY";
  if (upper.includes("BLUE")) return "BLUE";
  if (upper.includes("RED")) return "RED";
  if (upper.includes("GREEN")) return "GREEN";
  if (upper.includes("BROWN")) return "BROWN";
  if (upper.includes("ORANGE")) return "ORANGE";
  if (upper.includes("PURPLE")) return "PURPLE";

  return "";
}

/**
 * Normalizes interior material to supported enum values
 */
function normalizeInteriorMaterial(material: string): string {
  if (!material) return "";
  const upper = material.toUpperCase().trim();

  // Common trim names that are color/finish labels, not materials
  const fabricAliases = [
    "TITANIUM BLACK-ANTHRACITE",
    "TITANIUM BLACK/BLACK",
    "TITANIUM BLACK-PALOMINO BROWN",
    "SOUL/PALOMINO BROWN",
    "SOUL BLACK/SOUL",
    "BLACK/BLACK/STORM GRAY",
  ];
  if (fabricAliases.some((alias) => upper.includes(alias))) return "FABRIC";

  if (upper.includes("ALCANTARA")) return "ALCANTARA";
  if (upper.includes("PART") && upper.includes("LEATHER"))
    return "PART-LEATHER";
  if (upper.includes("LEATHER")) return "LEATHER";

  if (
    upper.includes("FABRIC") ||
    upper.includes("CLOTH") ||
    upper.includes("TEXTILE") ||
    upper.includes("TEXTIL") ||
    upper.includes("LOFT") ||
    upper.includes("LODGE")
  )
    return "FABRIC";

  return "";
}

/**
 * Normalize model value by stripping brand prefix and keeping base model token
 */
function normalizeModelValue(model: string, brand?: string): string {
  if (!model) return "";
  let cleaned = model.trim();

  if (brand) {
    const brandRegex = new RegExp(`^${brand}\\s+`, "i");
    cleaned = cleaned.replace(brandRegex, "").trim();
  }

  const firstToken = cleaned.split(/\s+/)[0];
  if (!firstToken) return "";
  return firstToken.toUpperCase();
}

/**
 * Extracts trim text from model value by removing brand and base model token
 */
function extractTrimFromModel(model: string, brand?: string): string {
  if (!model) return "";
  let cleaned = model.trim();

  if (brand) {
    const brandRegex = new RegExp(`^${brand}\\s+`, "i");
    cleaned = cleaned.replace(brandRegex, "").trim();
  }

  const parts = cleaned.split(/\s+/);
  if (parts.length <= 1) return "";
  return parts.slice(1).join(" ").trim();
}

/**
 * Extracts number from string (removes commas, spaces, units)
 * Returns as number (not string) for raw number fields
 */
function extractNumber(value: string): number | string {
  if (!value) return "";

  // Remove common units and extract numbers
  const numberMatch = value.replace(/[,\s]/g, "").match(/(\d+\.?\d*)/);
  if (!numberMatch) return "";

  const numStr = numberMatch[1];
  // Return as number if it's a valid number
  const num = parseFloat(numStr);
  return isNaN(num) ? "" : num;
}

/**
 * Extracts number as raw number (for numeric fields)
 */
function extractNumberRaw(value: string): number | "" {
  if (!value) return "";
  const num = extractNumber(value);
  return typeof num === "number" ? num : "";
}

/**
 * Extracts mileage number (removes "km" and commas)
 * Returns as raw number
 */
function extractMileage(value: string): number | "" {
  if (!value) return "";
  const cleaned = value.replace(/[,\s]/g, "").replace(/km/gi, "");
  const numberMatch = cleaned.match(/(\d+)/);
  if (!numberMatch) return "";
  const num = parseInt(numberMatch[1], 10);
  return isNaN(num) ? "" : num;
}

/**
 * Creates listing mapping rules for extracting data from PDFs to database structure
 */
export function createListingMappingRules(): MappingRule[] {
  return [
    {
      key: "data.brand.value",
      pattern: "Manufacturer\\s{2,}([A-Za-z]+)\\s{2,}Model",
      transform: (v) => v.toUpperCase().trim(),
    },
    {
      key: "data.model.value",
      pattern: "Model\\s{2,}([^\\n\\r]+?)\\s{2,}Model Code",
      transform: (v) => v.trim(),
    },
    {
      key: "data.vin.value",
      pattern: "Vehicle Identification Number \\(VIN\\)\\s{2,}([A-Z0-9]{17})",
    },
    {
      key: "data.fuel_type.value",
      pattern: "Fuel Type\\s{2,}([^\\n\\r]+?)\\s{2,}Type",
      transform: normalizeFuelType,
    },
    {
      key: "data.body_type.value",
      pattern: "(?:Vehicle Type|Body)\\s{2,}([^\\n\\r]+?)\\s{2,}(?:Body|Cubic)",
      transform: normalizeBodyType,
    },
    {
      key: "data.drive_type.value",
      pattern:
        "(?:Front-wheel drive|All-wheel drive|Rear-wheel drive|4x4|AWD|FWD|RWD|1X0|Front-wheel)",
      defaultValue: "ALLWHEELDRIVE",
      transform: (v) => {
        if (!v) return "ALLWHEELDRIVE";
        const upper = v.toUpperCase();
        // Map front/rear variants to 2WHEELDRIVE to match enum values
        if (
          upper.includes("1X0") ||
          upper.includes("FRONT") ||
          upper.includes("FWD") ||
          upper.includes("REAR") ||
          upper.includes("RWD")
        )
          return "2WHEELDRIVE";
        if (
          upper.includes("ALL") ||
          upper.includes("4X4") ||
          upper.includes("AWD")
        )
          return "ALLWHEELDRIVE";
        return "ALLWHEELDRIVE";
      },
    },
    {
      key: "data.transmission_type.value",
      pattern: "(?:\\d+-speed\\s+)?(automatic|manual|CVT)",
      transform: normalizeTransmissionType,
      defaultValue: "AUTOMATIC",
    },
    {
      key: "data.exterior_color.value",
      pattern: "Manufacturer color\\s{2,}([^\\n\\r]+?)\\s{2,}Padding",
      transform: normalizeColor,
    },
    {
      key: "data.interior_color.value",
      // Not available in PDF, leave empty
      pattern: "(?!.*)", // Pattern that never matches
      defaultValue: "",
    },
    {
      key: "data.interior_material.value",
      pattern: "Padding\\s{2,}([^\\n\\r]+?)\\s{2,}Vehicle Type",
      transform: normalizeInteriorMaterial,
    },
    {
      key: "data.euro_norm.value",
      pattern: "Euro Emission Standard\\s{2,}([^\\n\\r]+?)\\s{2,}Power HP",
      transform: (v) => {
        if (!v || v.toLowerCase() === "unknown") return "";
        return v.toUpperCase().trim();
      },
    },
    {
      key: "data.seats.value",
      pattern: "Seats\\s{2,}(\\d+)",
      transform: extractNumberRaw,
    },
    {
      key: "data.doors.value",
      pattern: "Doors\\s{2,}(\\d+)",
      transform: extractNumberRaw,
    },
    {
      key: "data.cylinders.value",
      pattern: "Cylinder\\s{2,}(\\d+)",
      transform: extractNumberRaw,
    },
    {
      key: "data.co2_emission_g_km.value",
      pattern: "diesel combined\\s+([\\d,]+)\\s+g/km",
      transform: extractNumberRaw,
    },
    {
      key: "data.power_hp.value",
      pattern: "Power HP\\s{2,}(\\d+)\\s*PS",
      transform: extractNumberRaw,
    },
    {
      key: "data.mileage_km.value",
      pattern:
        "Mileage according to odometer\\s{2,}([^\\n\\r]+?)\\s{2,}Last Service",
      transform: extractMileage,
    },
    {
      key: "data.cubic_capacity_cm3.value",
      pattern: "Cubic Capacity\\s{2,}([\\d,]+)",
      transform: extractNumberRaw,
    },
    {
      key: "data.empty_weight_kg.value",
      pattern: "Gross Weight\\s{2,}([^\\n\\r]+?)\\s{2,}Cylinder",
      transform: (v) => {
        if (!v || v.toLowerCase() === "unknown") return "";
        const num = extractNumber(v);
        return typeof num === "number" ? num : "";
      },
    },
    {
      key: "data.fuel_consumption_l_100km.value",
      pattern: "diesel combined\\s+([\\d,]+\\.[\\d]+)\\s*l/100km",
      transform: (v) => {
        const num = extractNumber(v);
        return typeof num === "number" ? num : "";
      },
    },
    {
      key: "data.registration_date.value",
      pattern: "Reg\\. Date\\s{2,}([^\\n\\r]+?)\\s{2,}Delivery date",
      transform: (v) => {
        const parsed = parseDate(v);
        return parsed || [];
      },
    },
    {
      key: "price_b2c.value",
      pattern: "Selling Price\\s{2,}EUR([\\d,]+\\.[\\d]+)",
      transform: (v) => {
        if (!v) return "";
        // Remove commas and convert to number (e.g., "25,950.00" -> 2595000)
        const cleaned = v.replace(/,/g, "");
        const num = parseFloat(cleaned);
        if (isNaN(num)) return "";
        // Convert to integer (remove decimals by multiplying by 100)
        return Math.round(num * 100);
      },
    },
    {
      key: "price_b2c.currency",
      pattern: "(?!.*)", // Pattern that never matches
      defaultValue: "CHF",
    },
    {
      key: "price_b2b.value",
      pattern: "Selling Price\\s{2,}EUR([\\d,]+\\.[\\d]+)",
      transform: (v) => {
        if (!v) return "";
        // Remove commas and convert to number (e.g., "25,950.00" -> 2595000)
        const cleaned = v.replace(/,/g, "");
        const num = parseFloat(cleaned);
        if (isNaN(num)) return "";
        // Convert to integer (remove decimals by multiplying by 100)
        return Math.round(num * 100);
      },
    },
    {
      key: "price_b2b.currency",
      pattern: "(?!.*)", // Pattern that never matches
      defaultValue: "CHF",
    },
  ];
}

/**
 * Maps PDF to listing JSON structure with equipment extraction
 */
export function mapPdfToListingJson(
  pdfData: ExtractedTextData,
  template: JsonTemplate,
  mappingRules: MappingRule[]
): JsonTemplate {
  const fullText = pdfData.fullText;
  const result: JsonTemplate = JSON.parse(JSON.stringify(template)); // Deep clone template

  // Generate unique ID for this listing
  result.id = generateUniqueId();

  // Apply mapping rules
  for (const rule of mappingRules) {
    if (!rule.pattern) {
      // Rule without pattern - only use defaultValue
      if (rule.defaultValue !== undefined) {
        const defaultValue =
          rule.transform && rule.defaultValue
            ? rule.transform(rule.defaultValue)
            : rule.defaultValue;
        if (defaultValue !== null && defaultValue !== undefined) {
          setNestedValueDirect(result, rule.key, defaultValue);
        }
      }
      continue;
    }

    const rawValue = extractValueFromText(fullText, rule.pattern);

    if (rawValue) {
      // Apply transform if provided
      const value = rule.transform ? rule.transform(rawValue) : rawValue;

      // Use setNestedValueDirect to set values directly without extra nesting
      if (value !== null && value !== undefined) {
        setNestedValueDirect(result, rule.key, value);
      }
    } else if (rule.defaultValue !== undefined) {
      const defaultValue =
        rule.transform && rule.defaultValue
          ? rule.transform(rule.defaultValue)
          : rule.defaultValue;
      if (defaultValue !== null && defaultValue !== undefined) {
        setNestedValueDirect(result, rule.key, defaultValue);
      }
    }
  }

  // Extract equipment codes separately
  const equipment = extractEquipmentCodes(fullText);
  const data = result.data as JsonTemplate | undefined;
  // Normalize model to base token (e.g., "Volkswagen T-Roc R-Line" -> "T-ROC")
  if (
    data &&
    data.model &&
    typeof data.model === "object" &&
    data.model !== null &&
    "value" in data.model
  ) {
    const modelObj = data.model as { value?: unknown };
    const rawModel = typeof modelObj.value === "string" ? modelObj.value : "";
    const brandObj =
      data.brand &&
      typeof data.brand === "object" &&
      data.brand !== null &&
      "value" in data.brand
        ? (data.brand as { value?: unknown })
        : undefined;
    const rawBrand = typeof brandObj?.value === "string" ? brandObj.value : "";

    const normalizedModel = normalizeModelValue(rawModel, rawBrand);
    if (normalizedModel) {
      modelObj.value = normalizedModel;
    }

    const derivedTrim = extractTrimFromModel(rawModel, rawBrand);
    if (derivedTrim) {
      if (typeof result.trim === "string") {
        if (result.trim.trim() === "") {
          result.trim = derivedTrim;
        }
      } else if (
        data.trim &&
        typeof data.trim === "object" &&
        data.trim !== null &&
        "value" in data.trim
      ) {
        const trimObj = data.trim as { value?: unknown };
        if (!trimObj.value || String(trimObj.value).trim() === "") {
          trimObj.value = derivedTrim;
        }
      }
    }
  }
  if (
    data &&
    data.equipment &&
    typeof data.equipment === "object" &&
    data.equipment !== null &&
    "value" in data.equipment
  ) {
    (data.equipment as { value: unknown }).value =
      equipment.length > 0 ? equipment : [];
  }

  // Set VIN type based on whether VIN was found
  if (data && data.vin && typeof data.vin === "object" && data.vin !== null) {
    const vin = data.vin as { type: string; value: unknown };
    const vinValue = vin.value;
    if (!vinValue || vinValue === "") {
      vin.type = "err";
      vin.value = undefined;
    } else {
      vin.type = "ok";
    }
  }

  // Ensure drive_type has a default value if not found
  if (
    data &&
    data.drive_type &&
    typeof data.drive_type === "object" &&
    data.drive_type !== null &&
    "value" in data.drive_type
  ) {
    const driveType = data.drive_type as { value: unknown };
    if (!driveType.value || driveType.value === "") {
      driveType.value = "ALLWHEELDRIVE";
    }
  }

  // Set comparison_price.value to same as price_b2c.value and currency to CHF
  // Also set price_b2b.value to same as price_b2c.value
  const priceB2c = result.price_b2c as
    | { value: unknown; currency: string }
    | undefined;
  const priceB2b = result.price_b2b as
    | { value: unknown; currency: string }
    | undefined;
  const comparisonPrice = result.comparison_price as
    | { value: unknown; currency: string }
    | undefined;

  if (priceB2c && priceB2c.value) {
    // Set price_b2b.value to same as price_b2c.value
    if (priceB2b) {
      priceB2b.value = priceB2c.value;
      priceB2b.currency = "CHF";
    }
    // Set comparison_price.value to same as price_b2c.value
    if (comparisonPrice) {
      comparisonPrice.value = priceB2c.value;
      comparisonPrice.currency = "CHF";
    }
  }

  // Check all data fields and set type to "err" if value is empty
  if (data) {
    const fieldsToCheck = [
      "brand",
      "model",
      "fuel_type",
      "body_type",
      "drive_type",
      "transmission_type",
      "exterior_color",
      "interior_color",
      "interior_material",
      "energy_efficiency",
      "euro_norm",
      "seats",
      "doors",
      "cylinders",
      "co2_emission_g_km",
      "power_hp",
      "mileage_km",
      "cubic_capacity_cm3",
      "empty_weight_kg",
      "fuel_consumption_l_100km",
    ];

    for (const fieldName of fieldsToCheck) {
      const field = data[fieldName];
      if (
        field &&
        typeof field === "object" &&
        field !== null &&
        "type" in field &&
        "value" in field
      ) {
        const fieldObj = field as { type: string; value: unknown };
        if (isEmptyValue(fieldObj.value)) {
          fieldObj.type = "err";
          delete fieldObj.value;
        }
      }
    }
  }

  return result;
}
