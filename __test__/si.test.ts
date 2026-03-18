import { describe, expect, test } from "bun:test";

import { si } from "../src";

describe("si.vat", () => {
  test("valid Slovenian VAT", () => {
    const r = si.vat.validate("SI15012557");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = si.vat.validate("SI15012558");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("cannot start with 0", () => {
    const r = si.vat.validate("SI01234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("metadata", () => {
    expect(si.vat.country).toBe("SI");
  });
});
