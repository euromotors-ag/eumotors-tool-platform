import {
  EQUIPMENT_ITEM_GOOD_OPTIONS,
  EquipmentItem,
  EquipmentList,
} from "../../../libs/catalog/index.mjs";
import { StateSetter } from "../../../hooks/useSubstate";
import { Result } from "../../../libs/result/index.mjs";
import { useEffect, useState } from "react";
import {
  createOptionInputComponent,
  Section,
  StringInput,
} from "../common/sections";
import "./EquipmentEditor.css";

type T = Result<EquipmentList, undefined>;

const EquipmentOptionInputComponent = createOptionInputComponent(
  EQUIPMENT_ITEM_GOOD_OPTIONS.sort()
);

type Row = {
  ok: boolean;
  okValue: EquipmentItem | undefined;
  errValue: string | undefined;
};

// Helper function to check if a value is valid (not empty, undefined, "-", "none", etc.)
const isValidValue = (value: string | undefined): boolean => {
  return (
    value !== undefined &&
    value !== "" &&
    value !== "-" &&
    value !== "none" &&
    value !== "undefined"
  );
};

export function EquipmentEditor({
  initialState,
  setter,
}: {
  initialState: T;
  setter: StateSetter<T>;
}): React.ReactElement {
  const removeDuplicates = (equipmentList: Row[]): Row[] => {
    return equipmentList.filter((row, index, array) => {
      // First, filter out rows with empty/invalid values
      if (row.ok) {
        if (!isValidValue(row.okValue)) return false;

        // Then check for duplicates
        return (
          array.findIndex((r) => r.ok && r.okValue === row.okValue) === index
        );
      } else {
        if (!isValidValue(row.errValue)) return false;

        // Then check for duplicates
        return (
          array.findIndex((r) => !r.ok && r.errValue === row.errValue) === index
        );
      }
    });
  };

  const [list, setList] = useState<Row[]>(
    initialState.isOk()
      ? removeDuplicates(
          initialState
            .unwrap()
            .map((item) => ({
              ok: item.isOk(),
              okValue: item.isOk() ? item.unwrap() : "",
              errValue: item.isOk() ? "" : item.unwrapErr(),
            }))
            .sort((a, b) => {
              if (a.ok !== b.ok) {
                return a.ok ? 1 : -1;
              }
              if (a.ok) {
                return (a.okValue ?? "").localeCompare(b.okValue ?? "");
              } else {
                return (a.errValue ?? "").localeCompare(b.errValue ?? "");
              }
            })
        )
      : []
  );

  // Separate state for new empty item (shown at top)
  const [newItem, setNewItem] = useState<Row | null>(null);

  useEffect(() => {
    // Combine newItem (if it has content) with the main list
    const allItems = [...list];
    if (
      newItem &&
      (isValidValue(newItem.okValue) || isValidValue(newItem.errValue))
    ) {
      allItems.push(newItem);
    }

    setter(
      Result.ok(
        allItems.map((row) => {
          if (row.ok) {
            return Result.ok(row.okValue!);
          } else {
            return Result.err(row.errValue!);
          }
        })
      )
    );
  }, [list, newItem]);

  return (
    <div className="equipment-editor-container">
      <button
        className="cursor-pointer add-equipment-button mb-2"
        onClick={() => {
          setNewItem({
            ok: false,
            okValue: undefined,
            errValue: "",
          });
        }}>
        Add Item
      </button>
      <div className="equipment-items-list">
        {/* Show new item at the top if it exists */}
        {newItem && (
          <ItemInput
            row={newItem}
            setRow={(newRow) => {
              setNewItem(newRow);
              // If user entered a valid value, move it to the main list
              if (
                isValidValue(newRow.okValue) ||
                isValidValue(newRow.errValue)
              ) {
                const newList = [newRow, ...list];
                setList(removeDuplicates(newList));
                setNewItem(null); // Clear the new item
              }
            }}
            onDeleteClick={() => {
              setNewItem(null); // Just remove the new item
            }}
            key="new-item"
          />
        )}

        {/* Show existing items */}
        {list.map((row, index) => (
          <ItemInput
            row={row}
            setRow={(newRow) => {
              const newList = [...list];
              newList[index] = newRow;
              // Remove duplicates when user actually enters a value
              setList(removeDuplicates(newList));
            }}
            onDeleteClick={() => {
              const newList = [...list];
              newList.splice(index, 1);
              setList(newList);
            }}
            key={index}
          />
        ))}
      </div>
    </div>
  );
}

function ItemInput({
  row,
  setRow,
  onDeleteClick,
}: {
  row: Row;
  setRow: StateSetter<Row>;
  onDeleteClick: () => void;
}): React.ReactElement {
  const isValidOk = (v: EquipmentItem | undefined): boolean => {
    return isValidValue(v);
  };

  const isValidErr = (v: string | undefined): boolean => {
    return isValidValue(v);
  };

  return (
    <div className="equipment-item-input">
      <Section
        active={row.ok}
        color="#B4FFBE"
        state={[
          row.okValue,
          (v) => setRow({ ...row, ok: isValidOk(v), okValue: v }),
        ]}
        Input={EquipmentOptionInputComponent}
        onClick={() => setRow({ ...row, ok: isValidOk(row.okValue) })}
      />
      <Section
        active={!row.ok}
        color="#FFF0AD"
        state={[
          row.errValue,
          (v) => setRow({ ...row, ok: !isValidErr(v), errValue: v }),
        ]}
        Input={StringInput}
        onClick={() => setRow({ ...row, ok: !isValidErr(row.errValue) })}
      />
      <button
        className="cursor-pointer delete-equipment-button"
        onClick={onDeleteClick}>
        Delete
      </button>
    </div>
  );
}
