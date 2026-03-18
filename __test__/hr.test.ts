import { describe, expect, test } from "bun:test";

import { hr } from "../src";

describe("hr.vat", () => {
  test("valid Croatian VAT", () => {
    const r = hr.vat.validate("HR33392005961");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = hr.vat.validate("HR33392005962");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = hr.vat.validate("HR1234567890");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(hr.vat.country).toBe("HR");
  });
});
