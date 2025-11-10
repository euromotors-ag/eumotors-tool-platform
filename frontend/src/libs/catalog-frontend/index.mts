import {
  CarListing as BackendCarListing,
  CarData as BackendCarData,
  ParsingResult,
} from "../catalog/index.mjs";
import { FrontendCarData, FrontendCarListing } from "./types.mjs";
import { Result } from "../result/index.mjs";
import {
  BODY_TYPE,
  BRAND,
  COLOR,
  DRIVE_TYPE,
  ENERGY_EFFICIENCY,
  EQUIPMENT,
  EURO_NORM,
  FUEL_TYPE,
  TRANSMISSION_TYPE,
} from "./dict.mjs";

export * from "./types.mjs";
export type {
  CarListing as BackendCarListing,
  CarData as BackendCarData,
  ParsingResult,
  Currency,
} from "../catalog/index.mjs";
export { parseCarListing as parseBackendListing } from "../catalog/index.mjs";

export function convertBackendToFrontendListing(
  backend: BackendCarListing
): FrontendCarListing {
  const data: FrontendCarData = convertBackendToFrontendCarData(backend.data);

  if (
    backend.price_b2b.currency !== backend.price_b2c.currency ||
    backend.price_b2b.currency !== backend.comparison_price.currency
  ) {
    throw new Error("All prices must use the same currency");
  }

  return {
    id: backend.id,
    title: `${data.brand ?? ""} ${data.model ?? ""}`.trim(),
    images: backend.images,
    data,
    price_value: Math.round(backend.price_b2b.value),
    comparison_price_value: backend.comparison_price.value,
    currency: backend.price_b2b.currency,
    comparison_link: backend.comparison_link,
    comparison_text: backend.comparison_text,
    unique: backend.unique,
    trim: backend.trim,
    dealer_phone: backend.dealer_phone,
    dealer_email: backend.dealer_email,
  };
}

function convertBackendToFrontendCarData(
  backend: BackendCarData
): FrontendCarData {
  const equipmentList = backend.equipment
    .map((arr) =>
      arr
        .map((item) => resultEnumToString(item, EQUIPMENT))
        .filter((item) => item !== "")
    )
    .unwrapOr(undefined);

  return {
    brand: parsingResultEnumToString(backend.brand, BRAND),
    model: parsingResultEnumToString(backend.model, new Map()),
    fuel_type: parsingResultEnumToString(backend.fuel_type, FUEL_TYPE),
    body_type: parsingResultEnumToString(backend.body_type, BODY_TYPE),
    drive_type: parsingResultEnumToString(backend.drive_type, DRIVE_TYPE),
    transmission_type: parsingResultEnumToString(
      backend.transmission_type,
      TRANSMISSION_TYPE
    ),
    exterior_color: parsingResultEnumToString(backend.exterior_color, COLOR),
    interior_color: parsingResultEnumToString(backend.interior_color, COLOR),
    energy_efficiency: parsingResultEnumToString(
      backend.energy_efficiency,
      ENERGY_EFFICIENCY
    ),
    euro_norm: parsingResultEnumToString(backend.euro_norm, EURO_NORM),
    equipment: equipmentList,
    seats: backend.seats.unwrapOr(undefined),
    doors: backend.doors.unwrapOr(undefined),
    cylinders: backend.cylinders.unwrapOr(undefined),
    co2_emission_g_km: backend.co2_emission_g_km.unwrapOr(undefined),
    power_hp: backend.power_hp.unwrapOr(undefined),
    mileage_km: backend.mileage_km.unwrapOr(undefined),
    cubic_capacity_cm3: backend.cubic_capacity_cm3.unwrapOr(undefined),
    empty_weight_kg: backend.empty_weight_kg.unwrapOr(undefined),
    fuel_consumption_l_100km:
      backend.fuel_consumption_l_100km.unwrapOr(undefined),
    registration_year: backend.registration_date.unwrapOr([])[0],
    registration_month: backend.registration_date.unwrapOr([])[1],
  };
}

function parsingResultEnumToString<T>(
  result: ParsingResult<T>,
  dict: Map<T, string>
): string | undefined {
  return resultToString(result, dict);
}

// Modify this function to preserve equipment items even if they don't have translations
function resultEnumToString<T extends string>(
  result: Result<T, string | undefined>,
  map: Map<T, string>
): string {
  if (!result.isOk()) return "";
  const value = result.unwrap();
  return map.get(value) || value; // Return original value if no mapping exists
}

function resultToString<T, E>(
  result: Result<T, E>,
  dict: Map<T, string>
): string | E {
  return result.match<string | E>({
    ok: (value) => {
      if (!dict.has(value)) {
        throw new Error(`Dictionary does not contain value: ${value}`);
      }
      return dict.get(value)!;
    },
    err: (error) => error,
  });
}
