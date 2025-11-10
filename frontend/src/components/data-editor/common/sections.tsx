import { State } from "../../../hooks/useSubstate";

export type SectionProps<T> = {
  active: boolean;
  color: string;
  state: State<T>;
  Input: React.FunctionComponent<{ state: State<T> }>;
  onClick: () => void;
};

export function Section<T>({
  active,
  color,
  state,
  Input,
  onClick,
}: SectionProps<T>): React.ReactElement {
  const getDarkerColor = (color: string): string => {
    if (color.startsWith("#")) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgb(${Math.floor(r * 0.6)}, ${Math.floor(g * 0.6)}, ${Math.floor(
        b * 0.6
      )})`;
    }
    return color;
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClick();
        }
      }}
      style={{
        backgroundColor: active ? color : "#374151",
        borderRadius: "4px",
        padding: "0 2px",
        border: active ? `1px solid ${color}` : "1px solid #4b5563",
        color: active ? getDarkerColor(color) : "#ffffff",
        fontWeight: active ? 600 : 400,
        transition: "all 0.2s ease",
      }}>
      <Input state={state} />
    </div>
  );
}

export function NumberInput({
  state,
}: {
  state: State<number | undefined>;
}): React.ReactElement {
  return (
    <input
      type="number"
      value={state[0] ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        if (val === "") {
          return;
        } else {
          state[1](Number(val));
        }
      }}
      style={{
        textAlign: "left",
        direction: "ltr",
      }}
    />
  );
}

export function createOptionInputComponent<T extends string>(
  options: T[]
): React.FunctionComponent<{ state: State<T | undefined> }> {
  return function ({
    state,
  }: {
    state: State<T | undefined>;
  }): React.ReactElement {
    return (
      <select
        value={state[0] ?? ""}
        onChange={(e) => {
          const val = e.target.value;
          if (val === "") {
            return;
          } else {
            state[1](val as T);
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
        }}
        style={{
          textAlign: "left",
          direction: "ltr",
          cursor: "pointer",
        }}>
        <option value="">-</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  };
}

export function StringInput({
  state,
  onEnterPress,
}: {
  state: State<string | undefined>;
  onEnterPress?: () => void;
}): React.ReactElement {
  return (
    <input
      type="text"
      value={state[0] ?? ""}
      onChange={(e) => {
        const val = e.target.value;
        if (val === "") {
          state[1](undefined);
        } else {
          state[1](val);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" && onEnterPress) {
          e.preventDefault();
          onEnterPress();
        }
      }}
      style={{
        textAlign: "left",
        direction: "ltr",
      }}
    />
  );
}

export function NoneInput({
  state,
}: {
  state: State<string | undefined>;
}): React.ReactElement {
  const isError = state[0] === undefined;

  return (
    <button
      className={`none cursor-pointer ${isError ? "error" : ""}`}
      onClick={() => state[1](undefined)}>
      None
    </button>
  );
}
