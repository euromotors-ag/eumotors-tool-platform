import { Result } from "../result/index.mjs";
import {
  BRAND_OPTIONS,
  COLOR_OPTIONS,
  MODEL_OPTIONS,
  CURRENCY_OPTIONS,
  EURO_NORM_OPTIONS,
  BODY_TYPE_OPTIONS,
  FUEL_TYPE_OPTIONS,
  DRIVE_TYPE_OPTIONS,
  EQUIPMENT_ITEM_OPTIONS,
  INTERIOR_MATERIAL_OPTIONS,
  TRANSMISSION_TYPE_OPTIONS,
  ENERGY_EFFICIENCY_OPTIONS,
} from "./enums.mjs";

/**
 * Represents a car listing.
 * Note: The programmer must ensure that price_b2b, price_b2c and comparison_price
 * all use the same currency.
 */
export type CarListing = {
  id: string;
  images: CarImage[];
  data: CarData;
  price_b2b: Price;
  price_b2c: Price;
  comparison_price: Price;
  comparison_link: string;
  comparison_text: string;
  comment: string; // for any internal information about the car
  trim: string;
  unique: string;
  dealer_phone: string;
  dealer_email: string;
};

export type CarImage = string; // id on the image server

export type CarData = {
  vin: ParsingResult<string>;
  brand: ParsingResult<Brand>;
  model: ParsingResult<Model>;
  seats: ParsingResult<number>;
  doors: ParsingResult<number>;
  power_hp: ParsingResult<number>;
  cylinders: ParsingResult<number>;
  mileage_km: ParsingResult<number>;
  fuel_type: ParsingResult<FuelType>;
  body_type: ParsingResult<BodyType>;
  euro_norm: ParsingResult<EuroNorm>;
  registration_date: RegistrationDate;
  drive_type: ParsingResult<DriveType>;
  exterior_color: ParsingResult<Color>;
  interior_color: ParsingResult<Color>;
  empty_weight_kg: ParsingResult<number>;
  co2_emission_g_km: ParsingResult<number>;
  cubic_capacity_cm3: ParsingResult<number>;
  equipment: Result<EquipmentList, undefined>;
  fuel_consumption_l_100km: ParsingResult<number>;
  interior_material: ParsingResult<InteriorMaterial>;
  energy_efficiency: ParsingResult<EnergyEfficiency>;
  transmission_type: ParsingResult<TransmissionType>;
};

export type Color = (typeof COLOR_OPTIONS)[number];
export type Brand = (typeof BRAND_OPTIONS)[number];
export type BodyType = (typeof BODY_TYPE_OPTIONS)[number];
export type EuroNorm = (typeof EURO_NORM_OPTIONS)[number];
export type FuelType = (typeof FUEL_TYPE_OPTIONS)[number];
export type DriveType = (typeof DRIVE_TYPE_OPTIONS)[number];
export type EquipmentItem = (typeof EQUIPMENT_ITEM_OPTIONS)[number];
export type TransmissionType = (typeof TRANSMISSION_TYPE_OPTIONS)[number];
export type EnergyEfficiency = (typeof ENERGY_EFFICIENCY_OPTIONS)[number];
export type InteriorMaterial = (typeof INTERIOR_MATERIAL_OPTIONS)[number];
export type Model = (typeof MODEL_OPTIONS)[keyof typeof MODEL_OPTIONS][number];

export type RegistrationDate = ParsingResult<(number | undefined)[]>;
export type EquipmentList = Result<EquipmentItem, string>[];

export type Price = {
  value: number;
  currency: Currency;
};

export type Currency = (typeof CURRENCY_OPTIONS)[number];
export * from "./enums.mjs";
export type ParsingResult<T> = Result<T, string | undefined>;
export { parseCarListing } from "./parse.mjs";
export { addSeatsEquipmentFromInteriorMaterial } from "./equipment-utils.mjs";
