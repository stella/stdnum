import { describe, expect, test } from "bun:test";

import { pa } from "../src";

describe("pa.ruc", () => {
  const valid = [
    "1-184-921 DV49",
    "2588017-1-831938 DV20",
    "1-184-921 DV 49", // space before DV digits
    "1-184-921 DV:49", // colon separator
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = pa.ruc.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  const invalid = [
    "1-184-921 DV00", // wrong DV
    "1-184-921", // missing DV
    "abc", // no segments
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = pa.ruc.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("checksum error code", () => {
    const r = pa.ruc.validate("1-184-921 DV00");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("format error for missing DV", () => {
    const r = pa.ruc.validate("1-184-921");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("compact normalizes spacing", () => {
    expect(pa.ruc.compact("1-184-921  DV 49")).toBe(
      "1-184-921 DV49",
    );
  });

  test("format adds DV spacing", () => {
    expect(pa.ruc.format("1-184-921 DV49")).toBe(
      "1-184-921 DV 49",
    );
    expect(
      pa.ruc.format("2588017-1-831938 DV20"),
    ).toBe("2588017-1-831938 DV 20");
  });

  test("metadata", () => {
    expect(pa.ruc.abbreviation).toBe("RUC");
    expect(pa.ruc.country).toBe("PA");
    expect(pa.ruc.entityType).toBe("any");
  });
});
