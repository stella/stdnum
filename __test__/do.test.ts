import { describe, expect, test } from "bun:test";

import { do_ } from "../src";

describe("do.rnc (company, 9 digits)", () => {
  test("valid RNC", () => {
    const r = do_.rnc.validate("131098193");
    expect(r.valid).toBe(true);
  });
  test("valid with dashes", () => {
    const r = do_.rnc.validate("1-31-09819-3");
    expect(r.valid).toBe(true);
  });
  test("valid with spaces", () => {
    const r = do_.rnc.validate("131 098 193");
    expect(r.valid).toBe(true);
  });
  test("invalid checksum", () => {
    const r = do_.rnc.validate("131098194");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_CHECKSUM");
  });
  test("non-digit characters", () => {
    const r = do_.rnc.validate("13109819A");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_FORMAT");
  });
});

describe("do.rnc (cédula, 11 digits)", () => {
  test("valid Cédula", () => {
    const r = do_.rnc.validate("00113918205");
    expect(r.valid).toBe(true);
  });
  test("valid Cédula (another)", () => {
    const r = do_.rnc.validate("22400022111");
    expect(r.valid).toBe(true);
  });
  test("valid with dashes", () => {
    const r = do_.rnc.validate("001-1391820-5");
    expect(r.valid).toBe(true);
  });
  test("invalid Luhn checksum", () => {
    const r = do_.rnc.validate("00113918206");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_CHECKSUM");
  });
});

describe("do.rnc (common)", () => {
  test("wrong length", () => {
    const r = do_.rnc.validate("1310981");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_LENGTH");
  });
  test("10 digits rejected", () => {
    const r = do_.rnc.validate("1310981930");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_LENGTH");
  });
  test("compact strips separators", () => {
    expect(do_.rnc.compact("131-098-193")).toBe("131098193");
  });
  test("format 9-digit RNC", () => {
    expect(do_.rnc.format("131098193")).toBe("1-31-09819-3");
  });
  test("format 11-digit Cédula", () => {
    expect(do_.rnc.format("00113918205")).toBe("001-1391820-5");
  });
  test("metadata", () => {
    expect(do_.rnc.abbreviation).toBe("RNC");
    expect(do_.rnc.country).toBe("DO");
    expect(do_.rnc.entityType).toBe("any");
  });
});
