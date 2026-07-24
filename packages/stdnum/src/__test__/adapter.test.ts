import {
  afterEach,
  describe,
  expect,
  test,
} from "bun:test";

import businessid, {
  compact,
  format,
  generate,
  validate,
} from "../generated/at/businessid";
import {
  asNativeBinding,
  type NativeStdnumBinding,
} from "../native";
import { setBinding } from "../runtime";

const fakeBinding = new Proxy(
  {},
  {
    get: (_target, key) => {
      if (key === "compact" || key === "compactIndex")
        return (_id: string | number, value: string) =>
          value.replaceAll(" ", "").toLowerCase();
      if (key === "format" || key === "formatIndex")
        return (_id: string | number, value: string) =>
          `FN ${value}`;
      if (key === "validate" || key === "validateIndex")
        return (_id: string | number, value: string) =>
          value === "invalid"
            ? {
                valid: false,
                error: {
                  code: "INVALID_FORMAT",
                  message: "invalid fixture",
                },
              }
            : {
                valid: true,
                compact: value
                  .replaceAll(" ", "")
                  .toLowerCase(),
              };
      if (key === "isValidCanonicalIndex")
        return (_index: number, value: string) =>
          value !== "invalid" && !value.includes(" ");
      if (key === "supportsCanonicalValidationIndex")
        return () => true;
      if (key === "validateManyIndex")
        return (
          _index: number,
          values: readonly string[],
        ) =>
          values.map((value) =>
            value === "invalid"
              ? {
                  valid: false,
                  error: {
                    code: "INVALID_FORMAT",
                    message: "invalid fixture",
                  },
                }
              : {
                  valid: true,
                  compact: value
                    .replaceAll(" ", "")
                    .toLowerCase(),
                },
          );
      if (key === "areAllCanonicalValidIndex")
        return (
          _index: number,
          values: readonly string[],
        ) =>
          values.every(
            (value) =>
              value !== "invalid" && !value.includes(" "),
          );
      if (key === "validateFastIndex")
        return (_index: number, value: string) => {
          if (value === "invalid")
            return {
              code: "INVALID_FORMAT",
              message: "invalid fixture",
            };
          return value.includes(" ") ? 2 : 1;
        };
      if (key === "generate" || key === "generateIndex")
        return () => "122119m";
      if (key === "parse" || key === "parseIndex")
        return () => null;
      return () => [];
    },
  },
) as NativeStdnumBinding;

describe("generated native adapter", () => {
  afterEach(() => setBinding(undefined));

  test("preserves metadata and delegates the full validator surface", () => {
    setBinding(fakeBinding);
    expect(businessid.country).toBe("AT");
    expect(compact("12 2119M")).toBe("122119m");
    expect(format("122119m")).toBe("FN 122119m");
    expect(validate("122119m")).toEqual({
      valid: true,
      compact: "122119m",
    });
    expect(validate("12 2119M")).toEqual({
      valid: true,
      compact: "122119m",
    });
    expect(validate("invalid")).toEqual({
      valid: false,
      error: {
        code: "INVALID_FORMAT",
        message: "invalid fixture",
      },
    });
    expect(
      businessid.validateMany(["122119m", "12 2119M"]),
    ).toEqual([
      { valid: true, compact: "122119m" },
      { valid: true, compact: "122119m" },
    ]);
    expect(generate()).toBe("122119m");
  });

  test("preserves a WASM module namespace with an initializer default", () => {
    const namespace = {
      default: () => undefined,
      validatorIds: () => undefined,
      validators: () => undefined,
      validatorMetadata: () => undefined,
      validate: () => undefined,
      compact: () => undefined,
      format: () => undefined,
      generate: () => undefined,
      parse: () => undefined,
    };
    expect(asNativeBinding(namespace)).not.toBeNull();
  });
});
