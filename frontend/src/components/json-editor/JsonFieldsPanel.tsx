/**
 * Enterprise-grade JSON Fields Panel
 * Shows all fields with proper dropdowns/selectors from database
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { enumApi } from "../../api/enum.api";
import { useJsonEditorStore } from "../../stores/json-editor.store";
import { State } from "../../hooks/useSubstate";

// Base input components
const BaseNumberInput: React.FunctionComponent<{
  state: State<number | undefined>;
}> = ({ state }) => {
  const [value, setValue] = state;
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => {
        const num = e.target.value === "" ? undefined : Number(e.target.value);
        setValue(num);
      }}
      className="w-full px-1.5 py-1 text-xs border-2 border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-200 placeholder-gray-400 transition-all"
      placeholder="Enter number"
    />
  );
};

const BaseStringInput: React.FunctionComponent<{
  state: State<string | undefined>;
}> = ({ state }) => {
  const [value, setValue] = state;
  return (
    <input
      type="text"
      value={value ?? ""}
      onChange={(e) => setValue(e.target.value || undefined)}
      className="w-full px-1.5 py-1 text-xs border-2 border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-200 placeholder-gray-400 transition-all"
      placeholder="Enter text"
    />
  );
};

// Create option input component (select dropdown)
function createOptionInputComponent(options: string[]) {
  return function OptionInput({ state }: { state: State<string | undefined> }) {
    const [value, setValue] = state;
    return (
      <select
        value={value ?? ""}
        onChange={(e) => setValue(e.target.value || undefined)}
        className="w-full px-1.5 py-1 text-xs border-2 border-gray-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-200 transition-all"
      >
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  };
}

// Wrapper components that work with string | number | undefined
const NumberInput: React.FunctionComponent<{
  state: [string | number | undefined, (val: string | number | undefined) => void];
}> = ({ state }) => {
  const [value, setValue] = state;
  const numberState: State<number | undefined> = [
    typeof value === "number" ? value : undefined,
    (val) => {
      if (val === undefined || val === null) {
        setValue(undefined);
      } else {
        setValue(val);
      }
    },
  ];
  return (
    <div className="relative">
      <BaseNumberInput state={numberState} />
    </div>
  );
};

const StringInput: React.FunctionComponent<{
  state: [string | number | undefined, (val: string | number | undefined) => void];
}> = ({ state }) => {
  const [value, setValue] = state;
  const stringState: State<string | undefined> = [
    typeof value === "string" ? value : value?.toString(),
    (val) => setValue(val === undefined ? undefined : val),
  ];
  return (
    <div className="relative">
      <BaseStringInput state={stringState} />
    </div>
  );
};

export function JsonFieldsPanel() {
  const workingJson = useJsonEditorStore((state) => state.workingJson);
  const updateField = useJsonEditorStore((state) => state.updateField);

  // Fetch all enum types from database
  const { data: bodyTypes = [] } = useQuery({
    queryKey: ["enums", "body_type"],
    queryFn: () => enumApi.getEnumsByType("body_type"),
    staleTime: 1000 * 60 * 10,
  });

  const { data: fuelTypes = [] } = useQuery({
    queryKey: ["enums", "fuel_type"],
    queryFn: () => enumApi.getEnumsByType("fuel_type"),
    staleTime: 1000 * 60 * 10,
  });

  const { data: driveTypes = [] } = useQuery({
    queryKey: ["enums", "drive_type"],
    queryFn: () => enumApi.getEnumsByType("drive_type"),
    staleTime: 1000 * 60 * 10,
  });

  const { data: transmissionTypes = [] } = useQuery({
    queryKey: ["enums", "transmission_type"],
    queryFn: () => enumApi.getEnumsByType("transmission_type"),
    staleTime: 1000 * 60 * 10,
  });

  const { data: colors = [] } = useQuery({
    queryKey: ["enums", "color"],
    queryFn: () => enumApi.getEnumsByType("color"),
    staleTime: 1000 * 60 * 10,
  });

  const { data: energyEfficiency = [] } = useQuery({
    queryKey: ["enums", "energy_efficiency"],
    queryFn: () => enumApi.getEnumsByType("energy_efficiency"),
    staleTime: 1000 * 60 * 10,
  });

  const { data: euroNorms = [] } = useQuery({
    queryKey: ["enums", "euro_norm"],
    queryFn: () => enumApi.getEnumsByType("euro_norm"),
    staleTime: 1000 * 60 * 10,
  });

  const { data: interiorMaterials = [] } = useQuery({
    queryKey: ["enums", "interior_material"],
    queryFn: () => enumApi.getEnumsByType("interior_material"),
    staleTime: 1000 * 60 * 10,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["enums", "brand"],
    queryFn: () => enumApi.getEnumsByType("brand"),
    staleTime: 1000 * 60 * 10,
  });

  const { data: modelOptions = {} } = useQuery({
    queryKey: ["enums", "model_options"],
    queryFn: () => enumApi.getModelOptions(),
    staleTime: 1000 * 60 * 10,
  });

  if (!workingJson) {
    return null;
  }

  // Create input components - wrapped to work with our store
  const createWrappedSelect = useMemo(() => {
    return (options: string[]) => {
      const BaseComponent = createOptionInputComponent(options.sort() as string[]);
      const WrappedComponent: React.FunctionComponent<{
        state: [string | number | undefined, (val: string | number | undefined) => void];
      }> = ({ state }) => {
        const [value, setValue] = state;
        const stringState: State<string | undefined> = [
          typeof value === "string" ? value : value?.toString() || undefined,
          (val) => setValue(val === undefined ? undefined : val),
        ];
        return <BaseComponent state={stringState} />;
      };
      return WrappedComponent;
    };
  }, []);

  const BrandInputComponent = useMemo(
    () => createWrappedSelect(brands),
    [brands, createWrappedSelect]
  );

  const FuelTypeInputComponent = useMemo(
    () => createWrappedSelect(fuelTypes),
    [fuelTypes, createWrappedSelect]
  );

  const BodyTypeInputComponent = useMemo(
    () => createWrappedSelect(bodyTypes),
    [bodyTypes, createWrappedSelect]
  );

  const DriveTypeInputComponent = useMemo(
    () => createWrappedSelect(driveTypes),
    [driveTypes, createWrappedSelect]
  );

  const TransmissionTypeInputComponent = useMemo(
    () => createWrappedSelect(transmissionTypes),
    [transmissionTypes, createWrappedSelect]
  );

  const ColorInputComponent = useMemo(
    () => createWrappedSelect(colors),
    [colors, createWrappedSelect]
  );

  const EnergyEfficiencyInputComponent = useMemo(
    () => createWrappedSelect(energyEfficiency),
    [energyEfficiency, createWrappedSelect]
  );

  const EuroNormInputComponent = useMemo(
    () => createWrappedSelect(euroNorms),
    [euroNorms, createWrappedSelect]
  );

  const InteriorMaterialInputComponent = useMemo(
    () => createWrappedSelect(interiorMaterials),
    [interiorMaterials, createWrappedSelect]
  );

  // Get brand value for dynamic model component
  const brandValue = (workingJson.brand as string) || "";
  const ModelInputComponent = useMemo(() => {
    const brandModels = modelOptions[brandValue] || [];
    return createWrappedSelect(brandModels);
  }, [brandValue, modelOptions, createWrappedSelect]);

  // State helpers - handle nested paths
  const getFieldValue = (key: string): string | number | undefined => {
    const obj = workingJson as Record<string, unknown>;
    const value = obj[key];
    
    // Handle price objects
    if ((key === "price_b2b" || key === "price_b2c" || key === "comparison_price") && 
        typeof value === "object" && value !== null && "value" in value) {
      return (value as { value: unknown }).value as number | undefined;
    }
    
    // Handle objects that shouldn't be objects (should have been flattened)
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      // If it's an object but not a price, try to stringify it for display
      // This shouldn't happen if flattening works correctly
      console.warn(`Field ${key} is still an object:`, value);
      return undefined;
    }
    
    return value as string | number | undefined;
  };

  const setFieldValue = (key: string, value: unknown) => {
    const obj = workingJson as Record<string, unknown>;
    
    // Handle price objects - update value property
    if ((key === "price_b2b" || key === "price_b2c" || key === "comparison_price") && 
        typeof obj[key] === "object" && obj[key] !== null && "value" in (obj[key] as object)) {
      const priceObj = obj[key] as { value: unknown; currency: string };
      updateField(key, { ...priceObj, value });
    } else {
      updateField(key, value);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl bg-card p-4 shadow-lg border border-border">
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl"></div>
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl"></div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Row 1: Basic Information & Engine & Performance */}
        {/* Basic Information Section */}
        <Section title="Basic Information" color="blue">
          <div className="flex flex-col space-y-2">
            {getFieldValue("id") !== undefined && (
              <FieldRow
                label="ID"
                value={getFieldValue("id")}
                onChange={(val) => setFieldValue("id", val)}
                Input={StringInput}
              />
            )}
            {getFieldValue("brand") !== undefined && (
              <FieldRow
                label="Brand"
                value={getFieldValue("brand")}
                onChange={(val) => setFieldValue("brand", val)}
                Input={BrandInputComponent}
              />
            )}
            {getFieldValue("model") !== undefined && (
              <FieldRow
                label="Model"
                value={getFieldValue("model")}
                onChange={(val) => setFieldValue("model", val)}
                Input={ModelInputComponent}
              />
            )}
            {getFieldValue("mileage_km") !== undefined && (
              <FieldRow
                label="Mileage (km)"
                value={getFieldValue("mileage_km")}
                onChange={(val) => setFieldValue("mileage_km", val)}
                Input={NumberInput}
              />
            )}
            {getFieldValue("registration_date") !== undefined && (
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-300 whitespace-nowrap min-w-[130px]">
                  Registration Date:
                </label>
                <div className="flex items-center gap-2 flex-1">
                  {Array.isArray((workingJson as Record<string, unknown>).registration_date) ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="number"
                        value={((workingJson as Record<string, unknown>).registration_date as number[])?.[0] || ""}
                        onChange={(e) => {
                          const current = ((workingJson as Record<string, unknown>).registration_date as number[]) || [undefined, undefined, undefined];
                          setFieldValue("registration_date", [Number(e.target.value) || undefined, current[1], current[2]]);
                        }}
                        placeholder="Year"
                        className="w-16 px-1.5 py-1 text-xs border border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-200 placeholder-gray-400 transition-all"
                      />
                      <input
                        type="number"
                        value={((workingJson as Record<string, unknown>).registration_date as number[])?.[1] || ""}
                        onChange={(e) => {
                          const current = ((workingJson as Record<string, unknown>).registration_date as number[]) || [undefined, undefined, undefined];
                          setFieldValue("registration_date", [current[0], Number(e.target.value) || undefined, current[2]]);
                        }}
                        placeholder="Month"
                        className="w-16 px-1.5 py-1 text-xs border border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-200 placeholder-gray-400 transition-all"
                      />
                      <input
                        type="number"
                        value={((workingJson as Record<string, unknown>).registration_date as number[])?.[2] || ""}
                        onChange={(e) => {
                          const current = ((workingJson as Record<string, unknown>).registration_date as number[]) || [undefined, undefined, undefined];
                          setFieldValue("registration_date", [current[0], current[1], Number(e.target.value) || undefined]);
                        }}
                        placeholder="Day"
                        className="w-16 px-1.5 py-1 text-xs border border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-200 placeholder-gray-400 transition-all"
                      />
                      <span className="text-xs text-gray-400 whitespace-nowrap">Year/Month/Day</span>
                    </div>
                  ) : (
                    <StringInput
                      state={[
                        String(getFieldValue("registration_date") || ""),
                        (val) => setFieldValue("registration_date", val),
                      ]}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Engine & Performance */}
        <Section title="Engine & Performance" color="green">
          <div className="flex flex-col space-y-2">
            {getFieldValue("fuel_type") !== undefined && (
              <FieldRow
                label="Fuel Type"
                value={getFieldValue("fuel_type")}
                onChange={(val) => setFieldValue("fuel_type", val)}
                Input={FuelTypeInputComponent}
              />
            )}
            {getFieldValue("power_hp") !== undefined && (
              <FieldRow
                label="Power (hp)"
                value={getFieldValue("power_hp")}
                onChange={(val) => setFieldValue("power_hp", val)}
                Input={NumberInput}
              />
            )}
            {getFieldValue("cylinders") !== undefined && (
              <FieldRow
                label="Cylinders"
                value={getFieldValue("cylinders")}
                onChange={(val) => setFieldValue("cylinders", val)}
                Input={NumberInput}
              />
            )}
            {getFieldValue("cubic_capacity_cm3") !== undefined && (
              <FieldRow
                label="Cubic Capacity (cm³)"
                value={getFieldValue("cubic_capacity_cm3")}
                onChange={(val) => setFieldValue("cubic_capacity_cm3", val)}
                Input={NumberInput}
              />
            )}
            {getFieldValue("fuel_consumption_l_100km") !== undefined && (
              <FieldRow
                label="Fuel Consumption (l/100km)"
                value={getFieldValue("fuel_consumption_l_100km")}
                onChange={(val) => setFieldValue("fuel_consumption_l_100km", val)}
                Input={NumberInput}
              />
            )}
            {getFieldValue("co2_emission_g_km") !== undefined && (
              <FieldRow
                label="CO2 Emission (g/km)"
                value={getFieldValue("co2_emission_g_km")}
                onChange={(val) => setFieldValue("co2_emission_g_km", val)}
                Input={NumberInput}
              />
            )}
          </div>
        </Section>

        {/* Row 2: Physical Characteristics & Appearance & Regulations */}
        {/* Physical Characteristics */}
        <Section title="Physical Characteristics" color="purple">
          <div className="flex flex-col space-y-2">
            {getFieldValue("body_type") !== undefined && (
              <FieldRow
                label="Body Type"
                value={getFieldValue("body_type")}
                onChange={(val) => setFieldValue("body_type", val)}
                Input={BodyTypeInputComponent}
              />
            )}
            {getFieldValue("drive_type") !== undefined && (
              <FieldRow
                label="Drive Type"
                value={getFieldValue("drive_type")}
                onChange={(val) => setFieldValue("drive_type", val)}
                Input={DriveTypeInputComponent}
              />
            )}
            {getFieldValue("transmission_type") !== undefined && (
              <FieldRow
                label="Transmission"
                value={getFieldValue("transmission_type")}
                onChange={(val) => setFieldValue("transmission_type", val)}
                Input={TransmissionTypeInputComponent}
              />
            )}
            {getFieldValue("seats") !== undefined && (
              <FieldRow
                label="Seats"
                value={getFieldValue("seats")}
                onChange={(val) => setFieldValue("seats", val)}
                Input={NumberInput}
              />
            )}
            {getFieldValue("doors") !== undefined && (
              <FieldRow
                label="Doors"
                value={getFieldValue("doors")}
                onChange={(val) => setFieldValue("doors", val)}
                Input={NumberInput}
              />
            )}
            {getFieldValue("empty_weight_kg") !== undefined && (
              <FieldRow
                label="Empty Weight (kg)"
                value={getFieldValue("empty_weight_kg")}
                onChange={(val) => setFieldValue("empty_weight_kg", val)}
                Input={NumberInput}
              />
            )}
          </div>
        </Section>

        {/* Appearance & Regulations */}
        <Section title="Appearance & Regulations" color="amber">
          <div className="flex flex-col space-y-2">
            {getFieldValue("exterior_color") !== undefined && (
              <FieldRow
                label="Exterior Color"
                value={getFieldValue("exterior_color")}
                onChange={(val) => setFieldValue("exterior_color", val)}
                Input={ColorInputComponent}
              />
            )}
            {getFieldValue("interior_color") !== undefined && (
              <FieldRow
                label="Interior Color"
                value={getFieldValue("interior_color")}
                onChange={(val) => setFieldValue("interior_color", val)}
                Input={ColorInputComponent}
              />
            )}
            {getFieldValue("interior_material") !== undefined && (
              <FieldRow
                label="Interior Material"
                value={getFieldValue("interior_material")}
                onChange={(val) => setFieldValue("interior_material", val)}
                Input={InteriorMaterialInputComponent}
              />
            )}
            {getFieldValue("energy_efficiency") !== undefined && (
              <FieldRow
                label="Energy Efficiency"
                value={getFieldValue("energy_efficiency")}
                onChange={(val) => setFieldValue("energy_efficiency", val)}
                Input={EnergyEfficiencyInputComponent}
              />
            )}
            {getFieldValue("euro_norm") !== undefined && (
              <FieldRow
                label="Euro Norm"
                value={getFieldValue("euro_norm")}
                onChange={(val) => setFieldValue("euro_norm", val)}
                Input={EuroNormInputComponent}
              />
            )}
          </div>
        </Section>

        {/* Pricing Section */}
        {(getFieldValue("price_b2b") !== undefined || 
          getFieldValue("price_b2c") !== undefined || 
          getFieldValue("comparison_price") !== undefined) && (
          <Section title="Pricing" color="blue">
            <div className="flex flex-col space-y-2">
              {getFieldValue("price_b2b") !== undefined && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-300 whitespace-nowrap min-w-[130px]">
                    Price B2B:
                  </label>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1">
                      <NumberInput
                        state={[
                          getFieldValue("price_b2b"),
                          (val) => setFieldValue("price_b2b", val),
                        ]}
                      />
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {(workingJson as Record<string, unknown>).price_b2b &&
                        typeof (workingJson as Record<string, unknown>).price_b2b === "object" &&
                        "currency" in ((workingJson as Record<string, unknown>).price_b2b as object)
                        ? ((workingJson as Record<string, unknown>).price_b2b as { currency: string }).currency
                        : "CHF"}
                    </span>
                  </div>
                </div>
              )}
              {getFieldValue("price_b2c") !== undefined && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-300 whitespace-nowrap min-w-[130px]">
                    Price B2C:
                  </label>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1">
                      <NumberInput
                        state={[
                          getFieldValue("price_b2c"),
                          (val) => setFieldValue("price_b2c", val),
                        ]}
                      />
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {(workingJson as Record<string, unknown>).price_b2c &&
                        typeof (workingJson as Record<string, unknown>).price_b2c === "object" &&
                        "currency" in ((workingJson as Record<string, unknown>).price_b2c as object)
                        ? ((workingJson as Record<string, unknown>).price_b2c as { currency: string }).currency
                        : "CHF"}
                    </span>
                  </div>
                </div>
              )}
              {getFieldValue("comparison_price") !== undefined && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-300 whitespace-nowrap min-w-[130px]">
                    Comparison Price:
                  </label>
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex-1">
                      <NumberInput
                        state={[
                          getFieldValue("comparison_price"),
                          (val) => setFieldValue("comparison_price", val),
                        ]}
                      />
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {(workingJson as Record<string, unknown>).comparison_price &&
                        typeof (workingJson as Record<string, unknown>).comparison_price === "object" &&
                        "currency" in ((workingJson as Record<string, unknown>).comparison_price as object)
                        ? ((workingJson as Record<string, unknown>).comparison_price as { currency: string }).currency
                        : "CHF"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Metadata Section */}
        {(getFieldValue("comparison_link") !== undefined ||
          getFieldValue("comparison_text") !== undefined ||
          getFieldValue("trim") !== undefined ||
          getFieldValue("unique") !== undefined ||
          getFieldValue("dealer_phone") !== undefined ||
          getFieldValue("dealer_email") !== undefined ||
          getFieldValue("comment") !== undefined) && (
          <Section title="Metadata" color="gray">
            <div className="flex flex-col space-y-2">
              {getFieldValue("comparison_link") !== undefined && (
                <FieldRow
                  label="Comparison Link"
                  value={getFieldValue("comparison_link")}
                  onChange={(val) => setFieldValue("comparison_link", val)}
                  Input={StringInput}
                />
              )}
              {getFieldValue("comparison_text") !== undefined && (
                <FieldRow
                  label="Comparison Text"
                  value={getFieldValue("comparison_text")}
                  onChange={(val) => setFieldValue("comparison_text", val)}
                  Input={StringInput}
                />
              )}
              {getFieldValue("trim") !== undefined && (
                <FieldRow
                  label="Trim"
                  value={getFieldValue("trim")}
                  onChange={(val) => setFieldValue("trim", val)}
                  Input={StringInput}
                />
              )}
              {getFieldValue("unique") !== undefined && (
                <FieldRow
                  label="Unique"
                  value={getFieldValue("unique")}
                  onChange={(val) => setFieldValue("unique", val)}
                  Input={StringInput}
                />
              )}
              {getFieldValue("dealer_phone") !== undefined && (
                <FieldRow
                  label="Dealer Phone"
                  value={getFieldValue("dealer_phone")}
                  onChange={(val) => setFieldValue("dealer_phone", val)}
                  Input={StringInput}
                />
              )}
              {getFieldValue("dealer_email") !== undefined && (
                <FieldRow
                  label="Dealer Email"
                  value={getFieldValue("dealer_email")}
                  onChange={(val) => setFieldValue("dealer_email", val)}
                  Input={StringInput}
                />
              )}
              {getFieldValue("comment") !== undefined && (
                <div className="flex items-start gap-2">
                  <label className="text-xs font-medium text-gray-300 whitespace-nowrap min-w-[130px] pt-1.5">
                    Comment:
                  </label>
                  <textarea
                    value={String(getFieldValue("comment") || "")}
                    onChange={(e) => setFieldValue("comment", e.target.value)}
                    className="flex-1 px-1.5 py-1 text-xs border border-gray-500 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-200 placeholder-gray-400 min-h-[60px] transition-all resize-y"
                    rows={2}
                  />
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Images Section - Full width */}
        {Array.isArray((workingJson as Record<string, unknown>).images) &&
          ((workingJson as Record<string, unknown>).images as unknown[]).length > 0 && (
            <div className="col-span-2">
              <Section title="Images" color="gray">
                <div className="text-xs text-gray-300">
                  {((workingJson as Record<string, unknown>).images as string[]).length} image(s)
                </div>
              </Section>
            </div>
          )}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  color,
}: {
  title: string;
  children: React.ReactNode;
  color: "blue" | "green" | "purple" | "amber" | "gray";
}): React.ReactElement {
  const colorClasses = {
    blue: "text-blue-400 border-blue-400/40",
    green: "text-green-400 border-green-400/40",
    purple: "text-purple-400 border-purple-400/40",
    amber: "text-amber-300 border-amber-300/40",
    gray: "text-gray-400 border-gray-400/40",
  };

  return (
    <div className="flex flex-col">
      <h3 className={`text-xs font-semibold ${colorClasses[color]} mb-1.5 border-b pb-0.5`}>
        {title}
      </h3>
      <div className="bg-gray-800/40 p-2 rounded border border-gray-700">
        {children}
      </div>
    </div>
  );
}

interface FieldRowProps {
  label: string;
  value: string | number | undefined;
  onChange: (value: string | number | undefined) => void;
  Input: React.FunctionComponent<{ state: [string | number | undefined, (val: string | number | undefined) => void] }>;
}

function FieldRow({ label, value, onChange, Input }: FieldRowProps) {
  // Create state tuple for Input component
  const state: [string | number | undefined, (val: string | number | undefined) => void] = [
    value,
    onChange,
  ];

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-gray-300 whitespace-nowrap min-w-[130px]">
        {label}:
      </label>
      <div className="flex-1 w-full">
        <Input state={state} />
      </div>
    </div>
  );
}
