import { Result } from "../result/index.mjs";
import { CarData, CarListing, EQUIPMENT_ITEM_OPTIONS } from "./index.mjs";
import { ZodType as ZType } from "zod";
import * as z from "zod";
import {
  BODY_TYPE_OPTIONS,
  BRAND_OPTIONS,
  COLOR_OPTIONS,
  DRIVE_TYPE_OPTIONS,
  ENERGY_EFFICIENCY_OPTIONS,
  EURO_NORM_OPTIONS,
  FUEL_TYPE_OPTIONS,
  TRANSMISSION_TYPE_OPTIONS,
  INTERIOR_MATERIAL_OPTIONS,
  MODEL_OPTIONS,
  EquipmentItem,
} from "./index.mjs";

const CurrencySchema = z.enum(["EUR", "CHF", "SEK"]);
const BrandSchema = z.enum(BRAND_OPTIONS as [string, ...string[]]);
const ColorSchema = z.enum(COLOR_OPTIONS as [string, ...string[]]);
const BodyTypeSchema = z.enum(BODY_TYPE_OPTIONS as [string, ...string[]]);
const FuelTypeSchema = z.enum(FUEL_TYPE_OPTIONS as [string, ...string[]]);
const EuroNormSchema = z.enum(EURO_NORM_OPTIONS as [string, ...string[]]);
const DriveTypeSchema = z.enum(DRIVE_TYPE_OPTIONS as [string, ...string[]]);
const PriceSchema = z.object({
  value: z.number(),
  currency: CurrencySchema,
});
const EquipmentItemSchema = z.enum(
  EQUIPMENT_ITEM_OPTIONS as [string, ...string[]]
);
const TransmissionTypeSchema = z.enum(
  TRANSMISSION_TYPE_OPTIONS as [string, ...string[]]
);
const EnergyEfficiencySchema = z.enum(
  ENERGY_EFFICIENCY_OPTIONS as [string, ...string[]]
);
const InteriorMaterialSchema = z.enum(
  INTERIOR_MATERIAL_OPTIONS as [string, ...string[]]
);

const getResultSchema = <T, E>(okSchema: ZType<T>, errSchema: ZType<E>) =>
  z
    .object({
      type: z.enum(["ok", "err"]),
      value: z.any().optional(),
    })
    .refine((result) => {
      if (result.type === "ok") {
        return okSchema.safeParse(result.value).success;
      } else {
        return errSchema.safeParse(result.value || undefined).success;
      }
    }, "Value does not match schema for result type")
    .transform((result): Result<T, E> => {
      if (result.type === "ok") {
        return Result.ok(okSchema.parse(result.value));
      } else {
        return Result.err(errSchema.parse(result.value));
      }
    }) as unknown as ZType<Result<T, E>>;

const getParsingResultSchema = <T extends unknown>(schema: ZType<T>) =>
  getResultSchema(schema, z.string().optional());

const EquipmentSchema: ZType<
  Result<Result<EquipmentItem, string>[], undefined>
> = getResultSchema(
  z.array(getResultSchema(EquipmentItemSchema, z.string())),
  z.undefined()
);

const RegistrationDateElementSchema = z
  .number()
  .nullable()
  .transform((n) => (n === null ? undefined : n)) as ZType<number | undefined>;

// Create a ModelSchema that validates against all possible model values
const allModels = Object.values(MODEL_OPTIONS).flat();
const ModelSchema = z.enum(allModels as [string, ...string[]]);

const CarDataSchema: ZType<CarData> = z.object({
  vin: getParsingResultSchema(z.string()),
  brand: getParsingResultSchema(BrandSchema),
  model: getParsingResultSchema(ModelSchema),
  fuel_type: getParsingResultSchema(FuelTypeSchema),
  body_type: getParsingResultSchema(BodyTypeSchema),
  drive_type: getParsingResultSchema(DriveTypeSchema),
  transmission_type: getParsingResultSchema(TransmissionTypeSchema),
  exterior_color: getParsingResultSchema(ColorSchema),
  interior_color: getParsingResultSchema(ColorSchema),
  interior_material: getParsingResultSchema(InteriorMaterialSchema),
  energy_efficiency: getParsingResultSchema(EnergyEfficiencySchema),
  euro_norm: getParsingResultSchema(EuroNormSchema),
  equipment: EquipmentSchema,
  seats: getParsingResultSchema(z.number()),
  doors: getParsingResultSchema(z.number()),
  cylinders: getParsingResultSchema(z.number()),
  co2_emission_g_km: getParsingResultSchema(z.number()),
  power_hp: getParsingResultSchema(z.number()),
  mileage_km: getParsingResultSchema(z.number()),
  cubic_capacity_cm3: getParsingResultSchema(z.number()),
  empty_weight_kg: getParsingResultSchema(z.number()),
  fuel_consumption_l_100km: getParsingResultSchema(z.number()),
  registration_date: getParsingResultSchema(
    z.array(RegistrationDateElementSchema)
  ),
});

const CarListingSchema: ZType<CarListing> = z.object({
  id: z.string(),
  images: z.array(z.string()),
  data: CarDataSchema,
  price_b2b: PriceSchema,
  price_b2c: PriceSchema,
  comparison_price: PriceSchema,
  comparison_link: z.string(),
  comparison_text: z.string(),
  comment: z.string(),
  trim: z.string(),
  unique: z.string(),
  dealer_phone: z.string(),
  dealer_email: z.string(),
});

export function parseCarListing(data: unknown): CarListing {
  return CarListingSchema.parse(data);
}
