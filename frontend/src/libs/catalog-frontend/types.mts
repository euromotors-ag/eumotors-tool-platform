import { Currency } from "../catalog/index.mjs";

export type FrontendCarListing = {
  id: string;
  title: string;
  images: CarImage[];
  data: FrontendCarData;
  price_value: number;
  comparison_price_value?: number;
  currency: Currency;
  comparison_link?: string;
  comparison_text?: string;
  unique: string;
  trim: string;
  dealer_phone: string;
  dealer_email: string;
};

export type CarImage = string; // id on the image server

export type FrontendCarData = {
  brand?: string;
  model?: string;
  fuel_type?: string;
  body_type?: string;
  drive_type?: string;
  transmission_type?: string;
  exterior_color?: string;
  interior_color?: string;
  interior_material?: string;
  energy_efficiency?: string;
  euro_norm?: string;
  equipment?: string[];
  seats?: number;
  doors?: number;
  cylinders?: number;
  co2_emission_g_km?: number;
  power_hp?: number;
  mileage_km?: number;
  cubic_capacity_cm3?: number;
  empty_weight_kg?: number;
  fuel_consumption_l_100km?: number;
  registration_year?: number;
  registration_month?: number;
};
