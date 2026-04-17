import { describe, expect, test } from "bun:test";

import { lv } from "../src";

describe("lv.vat", () => {
  test("valid Latvian legal entity VAT", () => {
    const r = lv.vat.validate("LV40003521600");
    expect(r.valid).toBe(true);
  });

  test("valid Latvian personal VAT", () => {
    const r = lv.vat.validate("LV16117519997");
    expect(r.valid).toBe(true);
  });

  test("valid Latvian new-format personal VAT", () => {
    const r = lv.vat.validate("LV32999999999");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum (legal)", () => {
    const r = lv.vat.validate("LV40003521601");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = lv.vat.validate("LV1234567890");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("new-format personal VAT must use second digit 2-9", () => {
    const r = lv.vat.validate("LV31000000000");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("old personal VAT must use century digit 0, 1 or 2", () => {
    const r = lv.vat.validate("LV28190736398");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("metadata", () => {
    expect(lv.vat.country).toBe("LV");
  });
});
