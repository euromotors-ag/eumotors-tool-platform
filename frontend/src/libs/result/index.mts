export class Result<T, E> {
  private constructor(private type: "ok" | "err", private value: T | E) {}

  static ok<T, E>(value: T): Result<T, E> {
    return new Result<T, E>("ok", value);
  }

  static err<T, E>(error: E): Result<T, E> {
    return new Result<T, E>("err", error);
  }

  static ok_or<T, E>(value: T | undefined, error: E): Result<T, E> {
    return value === undefined ? Result.err(error) : Result.ok(value);
  }

  isOk(): boolean {
    return this.type === "ok";
  }

  isErr(): boolean {
    return this.type === "err";
  }
  unwrap(): T {
    if (this.type === "ok") {
      return this.value as T;
    }
    throw new Error(`Called unwrap on an Err value: ${String(this.value)}`);
  }

  unwrapOr<S>(defaultValue: S): T | S {
    return this.type === "ok" ? (this.value as T) : defaultValue;
  }

  unwrapErr(): E {
    if (this.type === "err") {
      return this.value as E;
    }
    throw new Error(`Called unwrapErr on an Ok value: ${String(this.value)}`);
  }

  unwrapErrOr<F>(defaultValue: F): E | F {
    return this.type === "err" ? (this.value as E) : defaultValue;
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.type === "ok") {
      return Result.ok(fn(this.value as T));
    }
    return Result.err(this.value as E);
  }

  mapErr<F>(fn: (error: E) => F): Result<T, F> {
    if (this.type === "err") {
      return Result.err(fn(this.value as E));
    }
    return Result.ok(this.value as T);
  }

  or<F>(other: Result<T, F>): Result<T, F> {
    return (this.type === "ok" ? this : other) as Result<T, F>;
  }

  match<U>(options: { ok: (value: T) => U; err: (error: E) => U }): U {
    if (this.type === "ok") {
      return options.ok(this.value as T);
    }
    return options.err(this.value as E);
  }
}
