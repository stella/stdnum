import { describe, expect, test } from "bun:test";

import { az } from "../src";

describe("az.voen", () => {
  test("valid VÖEN (formatted with spaces)", () => {
    const r = az.voen.validate("140 155 5071");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("1401555071");
  });

  test("valid VÖEN (compact)", () => {
    const r = az.voen.validate("1400057421");
    expect(r.valid).toBe(true);
  });

  test("valid VÖEN (9 digits, prepends 0)", () => {
    const r = az.voen.validate("300725012");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("0300725012");
  });

  test("wrong length", () => {
    const r = az.voen.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });

  test("non-digit characters", () => {
    const r = az.voen.validate("ZZ00057421");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_FORMAT");
  });

  test("invalid last digit (not 1 or 2)", () => {
    const r = az.voen.validate("1400057424");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_COMPONENT");
  });

  test("invalid checksum", () => {
    const r = az.voen.validate("1401555081");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_CHECKSUM");
  });

  test("compact strips spaces", () => {
    expect(az.voen.compact("140 155 5071")).toBe(
      "1401555071",
    );
  });

  test("format adds spaces", () => {
    expect(az.voen.format("1401555071")).toBe(
      "140 155 5071",
    );
  });

  test("metadata", () => {
    expect(az.voen.abbreviation).toBe("VÖEN");
    expect(az.voen.country).toBe("AZ");
    expect(az.voen.entityType).toBe("any");
  });
});
