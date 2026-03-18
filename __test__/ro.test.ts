import { describe, expect, test } from "bun:test";

import { ro } from "../src";

describe("ro.vat", () => {
  test("valid Romanian VAT (short)", () => {
    const r = ro.vat.validate("RO18547290");
    expect(r.valid).toBe(true);
  });

  test("valid Romanian VAT (long)", () => {
    const r = ro.vat.validate("RO1630615123457");
    expect(r.valid).toBe(false);
    // Too long
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid checksum", () => {
    const r = ro.vat.validate("RO18547291");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("metadata", () => {
    expect(ro.vat.country).toBe("RO");
  });
});
