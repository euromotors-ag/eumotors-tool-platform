import { CarData, ParsingResult, Model } from "../../../libs/catalog/index.mjs";
import { State, useSubstate } from "../../../hooks/useSubstate";
import { useMemo } from "react";
import {
  BRAND_OPTIONS,
  MODEL_OPTIONS,
  COLOR_OPTIONS,
  FUEL_TYPE_OPTIONS,
  BODY_TYPE_OPTIONS,
  EURO_NORM_OPTIONS,
  DRIVE_TYPE_OPTIONS,
  INTERIOR_MATERIAL_OPTIONS,
  ENERGY_EFFICIENCY_OPTIONS,
  TRANSMISSION_TYPE_OPTIONS,
} from "../../../libs/catalog/index.mjs";
import {
  createParsingResultOptionInputComponent,
  ParsingResultNumberInput,
} from "./ParsingResultInput";
import "./DataEditor.css";
import "./ParsingResultInput.css";

const BrandInputComponent = createParsingResultOptionInputComponent(
  BRAND_OPTIONS.sort()
);
const FuelTypeInputComponent = createParsingResultOptionInputComponent(
  FUEL_TYPE_OPTIONS.sort()
);
const BodyTypeInputComponent = createParsingResultOptionInputComponent(
  BODY_TYPE_OPTIONS.sort()
);
const DriveTypeInputComponent = createParsingResultOptionInputComponent(
  DRIVE_TYPE_OPTIONS.sort()
);
const TransmissionTypeInputComponent = createParsingResultOptionInputComponent(
  TRANSMISSION_TYPE_OPTIONS.sort()
);
const ColorInputComponent = createParsingResultOptionInputComponent(
  COLOR_OPTIONS.sort()
);
const EnergyEfficiencyInputComponent = createParsingResultOptionInputComponent(
  ENERGY_EFFICIENCY_OPTIONS.sort()
);
const EuroNormInputComponent = createParsingResultOptionInputComponent(
  EURO_NORM_OPTIONS.sort()
);
const InteriorMaterialInputComponent = createParsingResultOptionInputComponent(
  INTERIOR_MATERIAL_OPTIONS.sort()
);
const createModelInputComponent = (brand: string) => {
  const brandModels = MODEL_OPTIONS[brand as keyof typeof MODEL_OPTIONS];
  if (!brandModels) return createParsingResultOptionInputComponent([]);
  return createParsingResultOptionInputComponent(brandModels.sort());
};
const NumberInputComponent = ParsingResultNumberInput;

export function DataEditor({
  state,
}: {
  state: State<CarData>;
}): React.ReactElement {
  const brandState = useSubstate(state, "brand");
  const modelState = useSubstate(state, "model");
  const seatsState = useSubstate(state, "seats");
  const doorsState = useSubstate(state, "doors");
  const powerHpState = useSubstate(state, "power_hp");
  const fuelTypeState = useSubstate(state, "fuel_type");
  const euroNormState = useSubstate(state, "euro_norm");
  const bodyTypeState = useSubstate(state, "body_type");
  const cylindersState = useSubstate(state, "cylinders");
  const mileageKmState = useSubstate(state, "mileage_km");
  const driveTypeState = useSubstate(state, "drive_type");
  const emptyWeightState = useSubstate(state, "empty_weight_kg");
  const exteriorColorState = useSubstate(state, "exterior_color");
  const interiorColorState = useSubstate(state, "interior_color");
  const co2EmissionState = useSubstate(state, "co2_emission_g_km");
  const cubicCapacityState = useSubstate(state, "cubic_capacity_cm3");
  const transmissionTypeState = useSubstate(state, "transmission_type");
  const interiorMaterialState = useSubstate(state, "interior_material");
  const energyEfficiencyState = useSubstate(state, "energy_efficiency");
  const fuelConsumptionState = useSubstate(state, "fuel_consumption_l_100km");

  // Get brand value for dynamic model component
  const brandValue = brandState[0].isOk() ? brandState[0].unwrapOr("") : "";

  // Memoize the ModelInputComponent based on brand
  const ModelInputComponent = useMemo(() => {
    return createModelInputComponent(brandValue);
  }, [brandValue]) as React.FunctionComponent<{
    state: State<ParsingResult<Model>>;
  }>;

  return (
    <div className="data-editor p-1 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-transparent">
      {/* Basic Information Section */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-blue-400 mb-4 border-b border-blue-500/30 pb-1">
          Basic Information
        </h3>
        <div className="flex flex-col space-y-1">
          <div className="parsing-result-input">
            <label>Brand</label>
            <BrandInputComponent state={brandState} />
          </div>
          <div className="parsing-result-input">
            <label>Model</label>
            <ModelInputComponent state={modelState} />
          </div>
          <div className="parsing-result-input">
            <label>Mileage (km)</label>
            <NumberInputComponent state={mileageKmState} />
          </div>
        </div>
      </div>

      {/* Engine and Performance */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-green-400 mb-4 border-b border-green-500/30 pb-1">
          Engine & Performance
        </h3>
        <div className="flex flex-col space-y-1">
          <div className="parsing-result-input">
            <label>Fuel Type</label>
            <FuelTypeInputComponent state={fuelTypeState} />
          </div>
          <div className="parsing-result-input">
            <label>Power (hp)</label>
            <NumberInputComponent state={powerHpState} />
          </div>
          <div className="parsing-result-input">
            <label>Cylinders</label>
            <NumberInputComponent state={cylindersState} />
          </div>
          <div className="parsing-result-input">
            <label>Cubic Capacity (cm³)</label>
            <NumberInputComponent state={cubicCapacityState} />
          </div>
          <div className="parsing-result-input">
            <label>Fuel Consumption (l/100km)</label>
            <NumberInputComponent state={fuelConsumptionState} />
          </div>
          <div className="parsing-result-input">
            <label>CO2 Emission (g/km)</label>
            <NumberInputComponent state={co2EmissionState} />
          </div>
        </div>
      </div>

      {/* Physical Characteristics */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-purple-400 mb-4 border-b border-purple-500/30 pb-1">
          Physical Characteristics
        </h3>
        <div className="flex flex-col space-y-1">
          <div className="parsing-result-input">
            <label>Body Type</label>
            <BodyTypeInputComponent state={bodyTypeState} />
          </div>
          <div className="parsing-result-input">
            <label>Drive Type</label>
            <DriveTypeInputComponent state={driveTypeState} />
          </div>
          <div className="parsing-result-input">
            <label>Transmission</label>
            <TransmissionTypeInputComponent state={transmissionTypeState} />
          </div>
          <div className="parsing-result-input">
            <label>Seats</label>
            <NumberInputComponent state={seatsState} />
          </div>
          <div className="parsing-result-input">
            <label>Doors</label>
            <NumberInputComponent state={doorsState} />
          </div>
          <div className="parsing-result-input">
            <label>Empty Weight (kg)</label>
            <NumberInputComponent state={emptyWeightState} />
          </div>
        </div>
      </div>

      {/* Appearance and Regulations */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-amber-300 mb-4 border-b border-amber-500/30 pb-1">
          Appearance & Regulations
        </h3>
        <div className="flex flex-col space-y-1">
          <div className="parsing-result-input">
            <label>Exterior Color</label>
            <ColorInputComponent state={exteriorColorState} />
          </div>
          <div className="parsing-result-input">
            <label>Interior Color</label>
            <ColorInputComponent state={interiorColorState} />
          </div>
          <div className="parsing-result-input">
            <label>Interior Material</label>
            <InteriorMaterialInputComponent state={interiorMaterialState} />
          </div>
          <div className="parsing-result-input">
            <label>Energy Efficiency</label>
            <EnergyEfficiencyInputComponent state={energyEfficiencyState} />
          </div>
          <div className="parsing-result-input">
            <label>Euro Norm</label>
            <EuroNormInputComponent state={euroNormState} />
          </div>
        </div>
      </div>
    </div>
  );
}
