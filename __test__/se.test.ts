import { describe, expect, test } from "bun:test";

import { se } from "../src";

describe("se.vat", () => {
  test("valid Swedish VAT", () => {
    const r = se.vat.validate("SE556188840401");
    expect(r.valid).toBe(true);
  });

  test("must end with 01", () => {
    const r = se.vat.validate("SE556188840402");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid Luhn", () => {
    const r = se.vat.validate("SE556188840501");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("metadata", () => {
    expect(se.vat.country).toBe("SE");
  });
});
