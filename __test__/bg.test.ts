import { describe, expect, test } from "bun:test";

import { bg } from "../src";

describe("bg.vat", () => {
  test("valid 9-digit Bulgarian VAT", () => {
    const r = bg.vat.validate("BG175074752");
    expect(r.valid).toBe(true);
  });

  test("valid 10-digit Bulgarian VAT", () => {
    const r = bg.vat.validate("BG7523169263");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum 9-digit", () => {
    const r = bg.vat.validate("BG175074753");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = bg.vat.validate("BG12345678901");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(bg.vat.country).toBe("BG");
  });
});
