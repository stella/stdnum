import { describe, expect, test } from "bun:test";

import { gb } from "../src";

describe("gb.vat", () => {
  const valid = ["980780684", "340804329", "346270013"];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = gb.vat.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid with GB prefix", () => {
    const r = gb.vat.validate("GB980780684");
    expect(r.valid).toBe(true);
  });

  test("valid government GD", () => {
    const r = gb.vat.validate("GD499");
    expect(r.valid).toBe(true);
  });

  test("invalid GD >= 500", () => {
    const r = gb.vat.validate("GD500");
    expect(r.valid).toBe(false);
  });

  test("valid health authority HA", () => {
    const r = gb.vat.validate("HA500");
    expect(r.valid).toBe(true);
  });

  test("invalid HA < 500", () => {
    const r = gb.vat.validate("HA499");
    expect(r.valid).toBe(false);
  });

  test("invalid checksum", () => {
    const r = gb.vat.validate("802311781");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = gb.vat.validate("12345678");
    expect(r.valid).toBe(false);
  });

  test("metadata", () => {
    expect(gb.vat.abbreviation).toBe("VAT");
    expect(gb.vat.country).toBe("GB");
  });
});

describe("gb.utr", () => {
  test("valid UTR", () => {
    const r = gb.utr.validate("1955839661");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = gb.utr.validate("2955839661");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = gb.utr.validate("12345678");
    expect(r.valid).toBe(false);
  });

  test("format", () => {
    expect(gb.utr.format("1955839661")).toBe("19558 39661");
  });

  test("metadata", () => {
    expect(gb.utr.abbreviation).toBe("UTR");
    expect(gb.utr.country).toBe("GB");
  });
});
