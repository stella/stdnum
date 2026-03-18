import { describe, expect, test } from "bun:test";

import { ee } from "../src";

describe("ee.vat", () => {
  test("valid Estonian VAT", () => {
    const r = ee.vat.validate("EE100931558");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = ee.vat.validate("EE100931559");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = ee.vat.validate("EE12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(ee.vat.country).toBe("EE");
  });
});
