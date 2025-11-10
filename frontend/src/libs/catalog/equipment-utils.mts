import { Result } from "../result/index.mjs";
import { EquipmentList, InteriorMaterial } from "./index.mjs";

/**
 * Maps interior material values to corresponding equipment items
 */
const INTERIOR_MATERIAL_TO_EQUIPMENT_MAP: Record<InteriorMaterial, string> = {
  LEATHER: "LEATHER SEATS",
  ALCANTARA: "ALCANTARA SEATS",
  "PART-LEATHER": "PART-LEATHER SEATS",
  FABRIC: "FABRIC SEATS",
};

/**
 * Automatically adds seats equipment based on interior material value
 * @param equipment - Current equipment list
 * @param interiorMaterial - Interior material value (if any)
 * @returns Updated equipment list with seats equipment added
 */
export function addSeatsEquipmentFromInteriorMaterial(
  equipment: Result<EquipmentList, undefined>,
  interiorMaterial: Result<InteriorMaterial, string | undefined>
): Result<EquipmentList, undefined> {
  // If no equipment or interior material, return as is
  if (!equipment.isOk() || !interiorMaterial.isOk()) {
    return equipment;
  }

  const currentEquipment = equipment.unwrap();
  const materialValue = interiorMaterial.unwrap();

  // If no interior material value, return current equipment
  if (!materialValue) {
    return equipment;
  }

  // Get the corresponding seats equipment item
  const seatsEquipment = INTERIOR_MATERIAL_TO_EQUIPMENT_MAP[materialValue];
  if (!seatsEquipment) {
    return equipment;
  }

  // Check if seats equipment already exists
  const hasSeatsEquipment = currentEquipment.some(
    (item) => item.isOk() && item.unwrap() === seatsEquipment
  );

  // If seats equipment already exists, return current equipment
  if (hasSeatsEquipment) {
    return equipment;
  }

  // Add the seats equipment to the list
  const updatedEquipment = [
    ...currentEquipment,
    Result.ok<string, string>(seatsEquipment),
  ];

  return Result.ok(updatedEquipment);
}
