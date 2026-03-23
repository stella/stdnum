import { describe, expect, test } from "bun:test";

import { cu } from "../src";

describe("cu.ni", () => {
  test("valid NI (1900s male)", () => {
    const r = cu.ni.validate("72062506561");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("72062506561");
  });

  test("valid NI (1900s female)", () => {
    const r = cu.ni.validate("91021027775");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces and dashes", () => {
    const r = cu.ni.validate("720625 06561");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("72062506561");
  });

  test("wrong length", () => {
    const r = cu.ni.validate("9102102777");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });

  test("non-digit characters", () => {
    const r = cu.ni.validate("9102102777A");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_FORMAT");
  });

  test("invalid date (month 13)", () => {
    const r = cu.ni.validate("72132506561");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_COMPONENT");
  });

  test("invalid date (day 32)", () => {
    const r = cu.ni.validate("72063206561");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_COMPONENT");
  });

  test("compact strips separators", () => {
    expect(cu.ni.compact("91-0210-27775")).toBe(
      "91021027775",
    );
  });

  test("format returns compact form", () => {
    expect(cu.ni.format("91021027775")).toBe("91021027775");
  });

  test("metadata", () => {
    expect(cu.ni.abbreviation).toBe("NI");
    expect(cu.ni.country).toBe("CU");
    expect(cu.ni.entityType).toBe("person");
  });
});
