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
      if (key === "compact")
        return (_id: string, value: string) =>
          value.replaceAll(" ", "").toLowerCase();
      if (key === "format")
        return (_id: string, value: string) =>
          `FN ${value}`;
      if (key === "validate")
        return (_id: string, value: string) => ({
          valid: true,
          compact: value,
        });
      if (key === "generate") return () => "122119m";
      if (key === "parse") return () => null;
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
