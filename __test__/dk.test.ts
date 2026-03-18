import { describe, expect, test } from "bun:test";

import { dk } from "../src";

describe("dk.vat", () => {
  test("valid Danish VAT", () => {
    const r = dk.vat.validate("DK13585628");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = dk.vat.validate("DK13585629");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("cannot start with 0", () => {
    const r = dk.vat.validate("DK01234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("metadata", () => {
    expect(dk.vat.country).toBe("DK");
  });
});
