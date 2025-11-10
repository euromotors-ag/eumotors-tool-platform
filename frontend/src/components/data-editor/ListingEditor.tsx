import { CarListing } from "../../libs/catalog/index.mjs";
import { State, useSubstate } from "../../hooks/useSubstate";
import { DataEditor } from "./DataEditor/DataEditor";
import { MetaEditor } from "./MetaEditor/MetaEditor";
import { EquipmentEditor } from "./EquipmentEditor/EquipmentEditor";

export function ListingEditor({
  state,
}: {
  state: State<CarListing>;
}): React.ReactElement {
  const dataState = useSubstate(state, "data");
  const equipmentState = useSubstate(dataState, "equipment");

  return (
    <div className="space-y-6 text-gray-100">
      <Section title="Listing">
        <MetaEditor state={state} />
      </Section>
      <Section
        title="Car Data"
        legend={
          <div className="flex items-center space-x-4 ml-4 text-xs">
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-400 mr-1.5"></div>
              <span className="text-gray-300">Basic Info</span>
            </div>
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 mr-1.5"></div>
              <span className="text-gray-300">Engine</span>
            </div>
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-purple-400 mr-1.5"></div>
              <span className="text-gray-300">Physical</span>
            </div>
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-300 mr-1.5"></div>
              <span className="text-gray-300">Appearance</span>
            </div>
          </div>
        }>
        <DataEditor state={dataState} />
      </Section>
      <Section
        title="Equipment"
        legend={
          <div className="flex items-center space-x-4 ml-4 text-xs">
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 mr-1.5"></div>
              <span className="text-gray-300">Ok</span>
            </div>
            <div className="flex items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-300 mr-1.5"></div>
              <span className="text-gray-300">Err</span>
            </div>
          </div>
        }>
        <EquipmentEditor
          initialState={equipmentState[0]}
          setter={equipmentState[1]}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
  legend,
}: {
  title: string;
  children?: React.ReactNode;
  legend?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mb-6">
      <div className="flex items-center mb-3 border-b border-gray-700 pb-2">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {legend}
      </div>
      <div className="bg-gray-800/40 p-5 rounded-xl border border-gray-700">
        {children}
      </div>
    </div>
  );
}
