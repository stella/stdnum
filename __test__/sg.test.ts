import { describe, expect, test } from "bun:test";

import { sg } from "../src";

describe("sg.uen", () => {
  const valid = [
    "00192200M", // business (ROB)
    "197401143C", // local company (ROC)
    "S16FC0121D", // other entity
    "T01FC6132D", // other entity
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = sg.uen.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid lowercase input", () => {
    const r = sg.uen.validate("00192200m");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = sg.uen.validate("0019 2200M");
    expect(r.valid).toBe(true);
  });

  const invalid = [
    "00192200X", // bad check letter
    "197401143X", // bad check letter (ROC)
    "1234567", // too short
    "12345678901", // too long
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = sg.uen.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("checksum error code (business)", () => {
    const r = sg.uen.validate("00192200X");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("checksum error code (local company)", () => {
    const r = sg.uen.validate("197401143X");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("compact strips spaces and uppercases", () => {
    expect(sg.uen.compact("0019 2200m")).toBe("00192200M");
  });

  test("metadata", () => {
    expect(sg.uen.abbreviation).toBe("UEN");
    expect(sg.uen.country).toBe("SG");
    expect(sg.uen.entityType).toBe("company");
  });
});
