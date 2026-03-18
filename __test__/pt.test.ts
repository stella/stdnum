import { describe, expect, test } from "bun:test";

import { pt } from "../src";

describe("pt.vat", () => {
  test("valid Portuguese VAT", () => {
    const r = pt.vat.validate("PT501964843");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = pt.vat.validate("PT501964844");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("cannot start with 0", () => {
    const r = pt.vat.validate("PT012345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("metadata", () => {
    expect(pt.vat.country).toBe("PT");
  });
});
