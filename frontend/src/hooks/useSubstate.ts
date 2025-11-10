export type State<T> = [T, (value: T) => void];
export type StateSetter<T> = (value: T) => void;

export function useSubstate<T, K extends keyof T>(
  [state, setState]: State<T>,
  key: K
): State<T[K]> {
  // Check if the key exists in the state object
  if (
    !state ||
    (typeof state === "object" && !(key in (state as Record<string, unknown>)))
  ) {
    // Return a safe fallback state for missing properties
    const fallbackState: State<T[K]> = [
      undefined as T[K],
      () => {
        console.warn(
          `Cannot set property '${String(key)}': property does not exist`
        );
      },
    ];
    return fallbackState;
  }

  return [
    state[key],
    (value: T[K]) => {
      setState({
        ...state,
        [key]: value,
      });
    },
  ];
}
