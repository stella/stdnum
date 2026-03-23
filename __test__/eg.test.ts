import { describe, expect, test } from "bun:test";

import { eg } from "../src";

describe("eg.tn", () => {
  test("valid TN", () => {
    const r = eg.tn.validate("100531385");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("100531385");
    }
  });

  test("valid with separators", () => {
    const r = eg.tn.validate("100-531-385");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("100531385");
    }
  });

  test("valid with spaces", () => {
    const r = eg.tn.validate("100 531 385");
    expect(r.valid).toBe(true);
  });

  test("valid with Arabic-Indic digits", () => {
    const r = eg.tn.validate("٣٣١-١٠٥-٢٦٨");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("331105268");
    }
  });

  test("valid with Extended Arabic-Indic digits", () => {
    const r = eg.tn.validate("۱۰۰۵۳۱۳۸۵");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("100531385");
    }
  });

  test("invalid: too short", () => {
    const r = eg.tn.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: contains letters", () => {
    const r = eg.tn.validate("VV3456789");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format adds hyphens", () => {
    expect(eg.tn.format("100531385")).toBe("100-531-385");
  });

  test("metadata", () => {
    expect(eg.tn.abbreviation).toBe("TN");
    expect(eg.tn.country).toBe("EG");
    expect(eg.tn.entityType).toBe("any");
  });
});
