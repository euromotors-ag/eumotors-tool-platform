import { ParsingResult } from "../../../libs/catalog/index.mjs";
import { State } from "../../../hooks/useSubstate";
import { useEffect, useState } from "react";
import { Result } from "../../../libs/result/index.mjs";
import "./ParsingResultInput.css";
import {
  createOptionInputComponent,
  NoneInput,
  NumberInput,
  Section,
  StringInput,
} from "../common/sections";

export function ParsingResultNumberInput({
  state,
}: {
  state: State<ParsingResult<number>>;
}): React.ReactElement {
  return <ParsingResultInput state={state} OkComponent={NumberInput} />;
}

export function createParsingResultOptionInputComponent<T extends string>(
  options: T[]
): React.FunctionComponent<{ state: State<ParsingResult<T>> }> {
  return function ParsingResultOptionInput({
    state,
  }: {
    state: State<ParsingResult<T>>;
  }): React.ReactElement {
    return (
      <ParsingResultInput
        state={state}
        OkComponent={createOptionInputComponent(options)}
      />
    );
  };
}

type ParsingResultInputProps<T> = {
  state: State<ParsingResult<T>>;
  OkComponent: React.FunctionComponent<{ state: State<T | undefined> }>;
};

function ParsingResultInput<T>({
  state: [res, setRes],
  OkComponent,
}: ParsingResultInputProps<T>): React.ReactElement {
  // Add safety check for when res is undefined
  if (!res) {
    return (
      <div className="parsing-result-input">
        <div className="text-red-500 text-sm">Data saknas</div>
      </div>
    );
  }

  const [values, setValues] = useState<{
    activeIdx: number;
    okValue: T | undefined;
    errValue: string | undefined;
  }>({
    activeIdx: res.isOk() ? 0 : res.unwrapErr() === undefined ? 2 : 1,
    okValue: res.unwrapOr(undefined),
    errValue: res.unwrapErrOr(undefined),
  });

  useEffect(() => {
    if (values.activeIdx === 0) {
      // For string values, allow empty strings (treat as valid empty string)
      if (typeof values.okValue === "string") {
        setRes(Result.ok(values.okValue as T));
      } else if (values.okValue === "") {
        setRes(Result.ok("" as unknown as T));
      } else if (values.okValue !== undefined) {
        setRes(Result.ok(values.okValue));
      }
    } else if (values.activeIdx === 1) {
      // Allow empty string in error field
      setRes(Result.err(values.errValue || ""));
    } else {
      setRes(Result.err(undefined));
    }
  }, [values]);

  return (
    <div className="parsing-result-input">
      <Section
        color="#B4FFBE"
        active={values.activeIdx === 0}
        state={[
          values.okValue,
          (v) => {
            const newValues = { ...values, okValue: v };
            // Always keep OK section active when user is editing
            newValues.activeIdx = 0;
            setValues(newValues);
          },
        ]}
        Input={OkComponent}
        onClick={() => {
          const newValues = { ...values };
          newValues.activeIdx = 0;
          setValues(newValues);
        }}
      />

      <Section
        color="#FFF0AD"
        active={values.activeIdx === 1}
        state={[
          values.errValue,
          (v) => {
            const newValues = { ...values, errValue: v };
            newValues.activeIdx = 1; // Always keep active if user is editing this field
            setValues(newValues);
          },
        ]}
        Input={StringInput}
        onClick={() => {
          const newValues = { ...values };
          newValues.activeIdx = 1; // Always set active when clicked
          setValues(newValues);
        }}
      />

      <Section
        color="#FF9090"
        active={values.activeIdx === 2}
        state={[
          undefined,
          () => {
            const newValues = {
              ...values,
              okValue: undefined,
              errValue: undefined,
            };
            newValues.activeIdx = 2;
            setValues(newValues);
          },
        ]}
        Input={NoneInput}
        onClick={() => {
          const newValues = { ...values };
          newValues.activeIdx = 2;
          setValues(newValues);
        }}
      />
    </div>
  );
}
