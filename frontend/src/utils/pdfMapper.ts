import type { ExtractedTextData } from "./pdfExtractor";
import { v4 as uuidv4 } from "uuid";
import { Buffer } from "buffer";

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
 * Equipment code to readable name mapping
 * Extracted from PDF text format: "CODE   Description"
 */
export const EQUIPMENT_CODE_MAP: Record<string, string> = {
  AV1: "DRIVING ON THE RIGHT",
  A8C: "COMFORT EQUIPMENT",
  B0A: "PART SET WITHOUT COUNTRY-SPECIFIC PRESCRIPTIVE STANDARD",
  B01: "TYPE APPROVAL COUNTRY GERMANY",
  C23: "OPERATING PERMIT, ALTERATION",
  C7J: "ALLOY WHEELS",
  DN4: "4-CYL. TURBO DIESEL",
  EL5: "REMOTE ACCESS / REMOTE ACCESS + ONLINE INFOTAINMENT",
  EM2: "ADVANCED DRIVER ATTENTION & DROWSINESS MONITOR",
  ER1: 'REGIONAL CODE " ECE " FOR RADIO',
  E0U: "SPECIAL EDITION",
  FB0: "STANDARD PAINT COATING",
  F0A: "NO SPECIAL PURPOSE VEHICLE, STANDARD EQUIPMENT",
  GM1: "STANDARD ELECTRONIC ENGINE SOUND",
  GP1: "VEHICLES WITH SPECIAL UPGRADE MEASURES",
  GV1: "PREPARATION FOR ALCOHOL INTERLOCK",
  G01: "SHOCK ABSORPTION IN FRONT",
  G1C: "7-SPEED AUTOMATIC TRANSMISSION",
  HS6: "TIRES 205/55 R17 91V LOW ROLLING RESISTANCE",
  IG1: "CURB WEIGHT RANGE 1",
  IN1: "REAR AXLE WEIGHT, TYPE 1",
  J2D: "BATTERY 380 A (68 AH)",
  KA6: "AREA VIEW 360°",
  KK3: "REFRIGERANT R1234YF",
  K8D: "WAGON/AVANT",
  LT1: "WITH SPEED LIMITER",
  L0L: "LEFT-HAND DRIVE",
  L07: "SUSPENSION RANGE 07 INSTALLATION CONTROL ONLY, NO REQUIREMENT FORECAST",
  ND1: "ADAPTER",
  NI1: "WITH UN-ECE CYBERSECURITY & SOFTWARE UPDATE",
  NY0: "STANDARD BATTERY/ALTERNATOR CAPACITY",
  NZ2: "EMERGENCY CALL SYSTEM ECALL+",
  N3D: "SEAT TRIM COVERS IN FABRIC/LEATHEREETTE LODGE",
  PAB: "ASSISTED DRIVE",
  PK1: "TOW BAR SWIVELING, EL. UNLOCKABLE AND WITH ADAPTER",
  PLN: "LIGHT&VIEW PREMIUM",
  PWC: "EL. ADJUSTABLE DRIVER SEAT AND EL. ADJUSTABLE PASSENGER SEAT, WITH MEMORY; EXTERIOR REAR VIEW MIRRORS WITH MEMORY",
  QG1: "LONGLIFE SERVICE REGIME",
  QH1: "VOICE CONTROL",
  "2B1": "ADDITIONAL EXTERIOR NOISE SUPPRESSION",
  "2CW": "VEHICLE CLASS DIFFERENTIATION -5EN-",
  "2FT":
    "LEATHER-WRAPPED MULTI-FUNCTION STEERING WHEEL, HEATED, WITH TIPTRONIC",
  "2H5": "DRIVING PROFILE SELECTION AND CONVENTIONAL SHOCK ABSORBER",
  "2JG": "BODY-COLORED BUMPERS",
  "3A2":
    "CHILD SEAT ANCHORS F. CHILD SEAT SYSTEM I-SIZE, 2X TOP TETHER AND CHILD SEAT ANCHORS IN FRONT ON FRONT PASSENGER SIDE",
  "3CX": "NET PARTITION",
  "3C7": "3-POINT SEAT BELT FOR CENTER REAR SEAT",
  "3D3": "CENTER CONSOLE",
  "3FU": "PANORAMIC ROOF (PSD)",
  "3GN": "VARIABLE LUGGAGE/LOAD COMPARTMENT FLOOR",
  "3NU": "UNSPLIT REAR SEAT BENCH, SPLIT FOLDING BACKREST, WITH CENTER ARMREST",
  "3N3": "STORAGE COMPARTMENTS IN TRUNK",
  "3PN": "POWER SEAT ADJUSTMENT FOR BOTH FRONT SEATS WITH MEMORY FEATURE",
  "3QT": "3-POINT SEAT BELTS IN FRONT, WITH TENSIONER AND HEIGHT ADJUSTMENT",
  "3Q7": "HEAD RESTRAINTS IN REAR WITH ADDITIONAL FUNCTION",
  "3S2": "BLACK ROOF RAILS",
  "3U6": "SEMI-EL. ROLLO (WITH SUN ROLLO, WITH STORAGE BOX)",
  "3W3": "SPECIAL INTERIOR NOISE SUPPRESSION",
  "3ZU": "3-POINT SEAT BELTS, OUTER REAR WITH ECE LABEL",
  "4AU": "DOOR AND SIDE TRIM PANEL (UMBRELLA)",
  "4A3": "SEAT HEATER FOR FRONT SEATS SEPARATELY CONTROLLED",
  "4E6": "VIRTUAL PEDAL",
  "4GW": "HEATED WINDSHIELD",
  "4G3": "WITH EMERGENCY STEERING SUPPORT WITH TURN ASSIST",
  "4H5": "POWER-OPERATED CHILD SAFETY LOCK",
  "4K6": "KEYLESS LOCKING AND STARTING SYSTEM KEYLESS ADVANCED WITH SAFELOCK",
  "4L6": "BREAKAWAY INTERIOR REARVIEW MIRROR, AUTO- DIMMING",
  "4N1": "PADDED DASHBOARD",
  "4P3": "REAR FLOOR PANEL MODULE, TYPE 4",
  "4R4": "POWER WINDOWS WITH COMFORT OPERATION ANDCIRCUIT BREAKER",
  "4UN":
    "AIRBAG ON DRIVER AND FRONT PASSENGER SIDE, KNEE AIRBAG ON DRIVER SIDE, WITH FRONT PASSENGER AIRBAG DEACTIVATION",
  "4WE": "EMISSION STANDARD, WLTP3 M1, N1- I//EU6EA",
  "4ZE": "BLACK DECORATIVE TRIMS",
  "5F1": "UWB-CAPABLE COUNTRY AND CARRIER FREQUENCY, 433.92 TO 434.42 MHZ",
  QI6: "SERVICE INDICATOR 30 000   KM OR 2 YEARS ( VARIABLE )",
  QK1: "WITH MULTIFUNCTION CAMERA",
  QQ3: "INTERIOR AMBIENT LIGHTING AND SURROUND LIGHTING",
  QR9: "WITH DYNAMIC ROAD SIGN DISPLAY",
  QV3: "DAB - DIGITAL RADIO RECEPTION",
  Q2J: "COMFORT SEATS IN FRONT (SPORTS SEATS FORRS)",
  S18: "REGION",
  S4Y: "REGION",
  T6M: "4-CYLINDER DIESEL ENGINE 2.0 L UNIT 05L.C",
  UG1: "HILL START ASSIST",
  UH2: "PARKING BRAKE",
  UK3: "MECHANICAL REAR SEAT RELEASE",
  U5A: "INSTRUMENT CLUSTER, KM/H SPEEDOMETER",
  U9E: "EXTERNAL, USB TYPE C DATA SOCKET(S) AND CHARGING SOCKET(S) WITH INCREASED CHARGING PERFORMANCE",
  VF0: "STANDARD PEDAL CLUSTER",
  VW5: "SUNSET + FRONT SIDE ACOUSTIC WINDOWS",
  V1P: "TIRE SUPPLIERS FOR EU COUNTRIES",
  WDD: "CANTON PACKAGE",
  W3R: "AM TOUR",
  YOZ: "REMOTE ACCESS + INFOTAINMENT ONLINE 3 YEARS",
  "0AC": "FRONT STABILIZER BAR",
  "0A2": "4 DOORS",
  "0B3": "WHEELBASE",
  "0FA": "STANDARD MANUFACTURING SEQUENCE",
  "0F5": "FUEL SYSTEM FOR DIESEL ENGINE",
  "0IJ":
    "INSTALLATION DIFFERENTIATION FOR TRANSMISSION DQ381 -- VEHICLE COMPONENTS --",
  "0NB": "NAMEPLATE SET (SKODA W. OCTAVIA, W/O 4X4, W/O HYBRID)",
  "0N1": "STANDARD REAR AXLE",
  "0P0": "REAR EXHAUST TAILPIPE (STANDARD)",
  "0VC": "MANUAL IN GERMAN",
  "0YP": "WEIGHT RANGE 14 INSTALLATION CONTROL ONLY, NO REQUIREMENT FORECAST",
  "0Y1": "STANDARD CLIMATIC ZONES",
  "1AQ":
    "BRAKE CONTROL SYSTEM FOR VEHICLES WITHOUT ELECTRIC DRIVE (ESC AND ELECTROMECHANICAL BRAKE BOOSTER)",
  "1EX": "SPECIAL IDENTIFICATION LABEL FOR EC FOR M1 PASSENGER VEHICLES",
  "1G9": "SPACE-SAVING SPARE WHEEL FOR TEMPORARY USE, RADIAL TIRE (5-HOLE)",
  "1JA": "REAR SHOCK ABSORPTION, BASIC VERSION 1",
  "1KE": "DISC BRAKES IN REAR",
  "1M6": "TRAILER HITCH MECHANICALLY SWIVELING ANDPOWER-DETACHABLE",
  "1NM": "TRIMS FOR ALLOY WHEELS",
  "1N3": "SPEED-RELATED VARIABLE STEERING ASSIST (SERVOTRONIC)",
  "1PF": "STANDARD WHEEL BOLTS",
  "1Q3": "MASS DAMPER FOR STEERING WHEEL, XX HZ",
  "1S1": "TOOL KIT AND JACK",
  "1X0": "FRONT-WHEEL DRIVE",
  "1Y3": "ELECTRONIC DIFFERENTIAL LOCK XDS, DYNAMIC TRACTION SUPPORT",
  "1ZE": "DISC BRAKES IN FRONT (GEOMET D)",
  "1Z0": "INITIAL STANDARD FUEL FILLING (6L)",
  "5JB":
    "EXTERIOR MIRRORS: CONVEX ON DRIVER SIDE, CONVEX ON FRONT PASSENGER SIDE",
  "5J1": "REAR SPOILER",
  "5K7":
    "TRANSPORT PROTECTION FILM (MINIMUM PROTECTION) WITH ADDITIONAL TRANSPORT PROTECTION MEASURES",
  "5MB": "DECORATIVE INSERTS",
  "5XC":
    "SUN VISORS WITH ILLUMINATED VANITY MIRROR ON DRIVER AND FRONT PASSENGER SIDE",
  "5ZF": "FRONT HEAD RESTRAINTS",
  "6C2":
    "SIDE AIRBAG IN FRONT WITH CURTAIN AIRBAGAND INTERACTION AIRBAG IN FRONT",
  "6EP": "ADDITIONAL STONE GUARD BODY COVERS",
  "6E3": "CENTER ARMREST IN FRONT",
  "6FF": "EXTERIOR MIRROR HOUSINGS AND VARIOUS ADD-ON PARTS IN BODY COLOR",
  "6I6": "LANE ASSIST WITH ADAPTIVE LANE GUIDANCE FUNCTION + EMERGENCY ASSIST",
  "6LG": "STANDARD VENT",
  "6M3": "NET PROGRAM + CARGOELEMENTS",
  "6SG": 'LUGGAGE COMPARTMENT FLOOR COVERING "COMFORT"',
  "6T2": "INTERIOR LIGHT IN FOOTWELL IN FRONT AND REAR",
  "6XL":
    "EXTERIOR MIRRORS WITH MEMORY FEATURE, AUTO- DIMMING, POWER-FOLDING/ADJUSTABLE/ HEATED",
  "7AL":
    "ANTI-THEFT ALARM SYSTEM, INTERIOR MONITORING, BACKUP HORN, AND TOWING PROTECTION",
  "7B2": "12-VOLT SOCKET IN LUGGAGE BOOT",
  "7E6": "ELECTRIC AUXILIARY AIR HEATER",
  "7J2": "FPK DISPLAY",
  "7K1": "TIRE PRESSURE MONITORING SYSTEM",
  "7L6": "START-STOP SYSTEM WITH REGENERATIVE BRAKING",
  "7P1": "POWER-ADJUSTABLE LUMBAR SUPPORT IN FRONTSEATS",
  "7UY": "NAVIGATION SYSTEM (BASELINE)",
  "7X2": "PARK DISTANCE CONTROL IN FRONT AND REAR",
  "8DG":
    "INFOTAINMENT SYSTEM WITH SCALABLE MODULE OPTIONS (OPTIONSINFOTAINMENT, MIB3 MODEL UPDATE) VERSION 2",
  "8GV": "ALTERNATOR 180   A",
  "8G5": "MULTIPLE MATRIX BEAM",
  "8IU": "LED HEADLAMPS WITH VARIABLE LIGHT DISTRIBUTION",
  "8J3":
    "FRONT ASSIST - WITH WARNING AND BRAKING REACTION TO VEHICLES, PEDESTRIANS AND CYCLISTS",
  "8M1": 'REAR WINDOW WIPER "AERO"',
  "8N6": "WINDSHIELD WIPER INTERMITTENT CONTROL WITH LIGHT/RAIN SENSOR",
  "8Q5": "DYNAMIC HEADLIGHT RANGE CONTROL, WITH CORNERING LIGHT (AFS 1)",
  "8TL": "REAR FOG LIGHT ON ONE SIDE, BACK-UP LIGHT ON BOTH SIDES",
  "8T3": "ADAPTIVE CRUISE CONTROL",
  "8VQ":
    "LED REAR COMBINATION LAMP, VARIABLE LIGHTING FUNCTIONS, SPECIAL STYLING",
  "8WM": "CORNERING AND ALL WEATHER LIGHT",
  "8X8": "WITH HEADLAMP WASHER SYSTEM, WITH WASHER FLUID LEVEL INDICATOR",
  "8Y1": "TWO-TONE HORN",
  "8ZQ": "ANTENNA FOR FM RECEPTION ONLY, DIVERSITY",
  "8Z5": "NOT HOT COUNTRY",
  "9AK": "CLIMATRONIC WITH IMPACT PRESSURE CONTROL, CFC-FREE",
  "9E3": "LUGGAGE COMPARTMENT LIGHTING",
  "9I5":
    "SEPARATE DAYTIME RUNNING LIGHT WITH AUTOMATIC HEADLIGHT CONTROL AND AUTOMAT. COMING AND LEAVING HOME FEATURE",
  "9P4":
    "VISUAL AND ACOUSTIC SEAT BELT REMINDER, ELECTRIC CONTACT IN FRONT AND REAR",
  "9TE": "ADDITIONAL RETRO-REFLECTORS (DOOR AREA)",
  "9VS": "SOUND SYSTEM CANTON",
  "9WJ": "SMART LINK (WIRED AND WIRELESS CONNECT)",
  "9ZQ":
    "COMFORT TELEPHONY: WIRELESS CHARGING (FAST CHARGE) WITHOUT EXTERNAL ANTENNA CONNECTION",
  "9Z0": "OPERATING VOLTAGE 12 V",
  X0A: "EQUIPMENT OPTIONS SUBSET FOR GERMANY",
};

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
        type: "ok",
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
 * Extracts equipment codes from PDF text and maps them to readable names
 */
function extractEquipmentCodes(
  text: string
): Array<{ type: "ok"; value: string }> {
  const equipment: Array<{ type: "ok"; value: string }> = [];

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

  // Match codes: 2-4 alphanumeric characters followed by 2+ spaces
  const codePattern = /\b([A-Z0-9]{2,4})\s{2,}/g;
  const foundCodes = new Set<string>();

  let match;
  while ((match = codePattern.exec(equipmentSection)) !== null) {
    const code = match[1].trim();
    if (code && EQUIPMENT_CODE_MAP[code] && !foundCodes.has(code)) {
      foundCodes.add(code);
      equipment.push({
        type: "ok",
        value: EQUIPMENT_CODE_MAP[code],
      });
    }
  }

  return equipment;
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
  return color.toUpperCase().trim();
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
        // Check for equipment code 1X0 which means Front-wheel drive
        if (
          upper.includes("1X0") ||
          upper.includes("FRONT") ||
          upper.includes("FWD")
        )
          return "FRONTWHEELDRIVE";
        if (
          upper.includes("ALL") ||
          upper.includes("4X4") ||
          upper.includes("AWD")
        )
          return "ALLWHEELDRIVE";
        if (upper.includes("REAR") || upper.includes("RWD"))
          return "REARWHEELDRIVE";
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
      transform: normalizeColor,
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
