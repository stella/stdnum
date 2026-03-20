import { describe, expect, test } from "bun:test";

import { ec } from "../src";

describe("ec.ruc", () => {
  const valid = [
    "1792060346001",
    "1790011674001",
    "1714307103001", // natural person
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = ec.ruc.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  const invalid = [
    "1763154690001", // invalid check digit
    "179206034601", // too short (12)
    "17920603460010", // too long (14)
    "179206034600A", // non-digit
    "2592060346001", // invalid province (25)
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = ec.ruc.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("checksum error code", () => {
    const r = ec.ruc.validate("1763154690001");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("compact strips spaces and dashes", () => {
    expect(ec.ruc.compact("1792060346-001")).toBe(
      "1792060346001",
    );
    expect(ec.ruc.compact("1792 0603 46001")).toBe(
      "1792060346001",
    );
  });

  test("metadata", () => {
    expect(ec.ruc.abbreviation).toBe("RUC");
    expect(ec.ruc.country).toBe("EC");
    expect(ec.ruc.entityType).toBe("any");
  });
});
