import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables FIRST
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Import PrismaClient AFTER env is loaded
import { CarEnumType } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { equipmentNormalizationService } from "../services/equipment-normalization.service.js";
// @ts-expect-error - This file may not exist during build, but is required for seeding script
import {
  EQUIPMENT_ITEM_GOOD_OPTIONS,
  EQUIPMENT_ITEM_TRASH_OPTIONS,
  BODY_TYPE_OPTIONS,
  FUEL_TYPE_OPTIONS,
  DRIVE_TYPE_OPTIONS,
  TRANSMISSION_TYPE_OPTIONS,
  COLOR_OPTIONS,
  INTERIOR_MATERIAL_OPTIONS,
  BRAND_OPTIONS,
  MODEL_OPTIONS,
  ENERGY_EFFICIENCY_OPTIONS,
  EURO_NORM_OPTIONS,
  CURRENCY_OPTIONS,
} from "../../frontend/src/libs/catalog/enums.mjs";

async function seedAllEnums() {
  console.log("Seeding all enums to database...\n");

  // Seed Equipment
  console.log("Seeding equipment...");
  
  let insertedGood = 0;
  let skippedGood = 0;
  
  for (const name of EQUIPMENT_ITEM_GOOD_OPTIONS) {
    const upperName = name.toUpperCase().trim();
    const code = equipmentNormalizationService.generateCanonicalCode(name);
    
    try {
      await prisma.equipment.create({
        data: {
          name: upperName,
          binCategory: "bin_good",
          code,
          source: "enum",
        },
      });
      insertedGood++;
    } catch (error: any) {
      if (error.code === "P2002") {
        // Unique constraint violation - already exists
        skippedGood++;
      } else {
        throw error;
      }
    }
  }
  console.log(`  ✓ Inserted ${insertedGood} good equipment items`);
  console.log(`  ✓ Skipped ${skippedGood} existing good equipment items`);

  let insertedTrash = 0;
  let skippedTrash = 0;
  
  for (const name of EQUIPMENT_ITEM_TRASH_OPTIONS) {
    const upperName = name.toUpperCase().trim();
    
    try {
      await prisma.equipment.create({
        data: {
          name: upperName,
          binCategory: "bin_trash",
          source: "enum",
        },
      });
      insertedTrash++;
    } catch (error: any) {
      if (error.code === "P2002") {
        // Unique constraint violation - already exists
        skippedTrash++;
      } else {
        throw error;
      }
    }
  }
  console.log(`  ✓ Inserted ${insertedTrash} trash equipment items`);
  console.log(`  ✓ Skipped ${skippedTrash} existing trash equipment items`);

  // Seed Body Types
  console.log("Seeding body types...");
  const bodyTypes = BODY_TYPE_OPTIONS.map((name: string) => ({
    name: name.toUpperCase().trim(),
    enumType: "body_type" as CarEnumType,
    source: "enum",
  }));
  const bodyResult = await prisma.carEnum.createMany({
    data: bodyTypes,
    skipDuplicates: true,
  });
  console.log(`  ✓ Created ${bodyResult.count} body types`);

  // Seed Fuel Types
  console.log("Seeding fuel types...");
  const fuelTypes = FUEL_TYPE_OPTIONS.map((name: string) => ({
    name: name.toUpperCase().trim(),
    enumType: "fuel_type" as CarEnumType,
    source: "enum",
  }));
  const fuelResult = await prisma.carEnum.createMany({
    data: fuelTypes,
    skipDuplicates: true,
  });
  console.log(`  ✓ Created ${fuelResult.count} fuel types`);

  // Seed Drive Types
  console.log("Seeding drive types...");
  const driveTypes = DRIVE_TYPE_OPTIONS.map((name: string) => ({
    name: name.toUpperCase().trim(),
    enumType: "drive_type" as CarEnumType,
    source: "enum",
  }));
  const driveResult = await prisma.carEnum.createMany({
    data: driveTypes,
    skipDuplicates: true,
  });
  console.log(`  ✓ Created ${driveResult.count} drive types`);

  // Seed Transmission Types
  console.log("Seeding transmission types...");
  const transmissionTypes = TRANSMISSION_TYPE_OPTIONS.map((name: string) => ({
    name: name.toUpperCase().trim(),
    enumType: "transmission_type" as CarEnumType,
    source: "enum",
  }));
  const transmissionResult = await prisma.carEnum.createMany({
    data: transmissionTypes,
    skipDuplicates: true,
  });
  console.log(`  ✓ Created ${transmissionResult.count} transmission types`);

  // Seed Colors
  console.log("Seeding colors...");
  const colors = COLOR_OPTIONS.map((name: string) => ({
    name: name.toUpperCase().trim(),
    enumType: "color" as CarEnumType,
    source: "enum",
  }));
  const colorResult = await prisma.carEnum.createMany({
    data: colors,
    skipDuplicates: true,
  });
  console.log(`  ✓ Created ${colorResult.count} colors`);

  // Seed Interior Materials
  console.log("Seeding interior materials...");
  const interiorMaterials = INTERIOR_MATERIAL_OPTIONS.map((name: string) => ({
    name: name.toUpperCase().trim(),
    enumType: "interior_material" as CarEnumType,
    source: "enum",
  }));
  const interiorResult = await prisma.carEnum.createMany({
    data: interiorMaterials,
    skipDuplicates: true,
  });
  console.log(`  ✓ Created ${interiorResult.count} interior materials`);

  // Seed Brands
  console.log("Seeding brands...");
  const brands = BRAND_OPTIONS.map((name: string) => ({
    name: name.toUpperCase().trim(),
    enumType: "brand" as CarEnumType,
    source: "enum",
  }));
  const brandResult = await prisma.carEnum.createMany({
    data: brands,
    skipDuplicates: true,
  });
  console.log(`  ✓ Created ${brandResult.count} brands`);

  // Seed Models (with parentId = brand)
  console.log("Seeding models...");
  const modelEntries: Array<{
    name: string;
    enumType: CarEnumType;
    parentId: string;
    source: string;
  }> = [];

  for (const [brand, models] of Object.entries(MODEL_OPTIONS)) {
    const modelArray = Array.isArray(models) ? models : [];
    for (const model of modelArray) {
      modelEntries.push({
        name: model.toUpperCase().trim(),
        enumType: "model" as CarEnumType,
        parentId: brand.toUpperCase().trim(),
        source: "enum",
      });
    }
  }

  const modelResult = await prisma.carEnum.createMany({
    data: modelEntries,
    skipDuplicates: true,
  });
  console.log(`  ✓ Created ${modelResult.count} models`);

  // Seed Energy Efficiency
  console.log("Seeding energy efficiency...");
  const energyEfficiency = ENERGY_EFFICIENCY_OPTIONS.map((name: string) => ({
    name: name.toUpperCase().trim(),
    enumType: "energy_efficiency" as CarEnumType,
    source: "enum",
  }));
  const energyResult = await prisma.carEnum.createMany({
    data: energyEfficiency,
    skipDuplicates: true,
  });
  console.log(`  ✓ Created ${energyResult.count} energy efficiency values`);

  // Seed Euro Norms
  console.log("Seeding euro norms...");
  const euroNorms = EURO_NORM_OPTIONS.map((name: string) => ({
    name: name.toUpperCase().trim(),
    enumType: "euro_norm" as CarEnumType,
    source: "enum",
  }));
  const euroResult = await prisma.carEnum.createMany({
    data: euroNorms,
    skipDuplicates: true,
  });
  console.log(`  ✓ Created ${euroResult.count} euro norms`);

  // Seed Currencies
  console.log("Seeding currencies...");
  const currencies = CURRENCY_OPTIONS.map((name: string) => ({
    name: name.toUpperCase().trim(),
    enumType: "currency" as CarEnumType,
    source: "enum",
  }));
  const currencyResult = await prisma.carEnum.createMany({
    data: currencies,
    skipDuplicates: true,
  });
  console.log(`  ✓ Created ${currencyResult.count} currencies`);

  console.log("\n✅ Seeding completed successfully!");
}

seedAllEnums()
  .catch((error) => {
    console.error("❌ Error seeding enums:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
