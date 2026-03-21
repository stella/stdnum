import { describe, expect, test } from "bun:test";

import { ph } from "../src";

describe("ph.philid", () => {
  const valid = [
    "123456789012",
    "000011112222",
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = ph.philid.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid with dashes", () => {
    const r = ph.philid.validate("1234-5678901-2");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("123456789012");
    }
  });

  test("valid with spaces", () => {
    const r = ph.philid.validate("1234 5678901 2");
    expect(r.valid).toBe(true);
  });

  // ─── Invalid ─────────────────────────────────

  const invalid = [
    "12345678901",   // too short (11)
    "1234567890123", // too long (13)
    "12345678901A",  // non-digit
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = ph.philid.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("rejects too short with length error", () => {
    const r = ph.philid.validate("12345678901");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("rejects non-digits with format error", () => {
    const r = ph.philid.validate("12345678901A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  // ─── Format ───────────────────────────────────

  test("format adds dashes (4-7-1)", () => {
    expect(ph.philid.format("123456789012")).toBe(
      "1234-5678901-2",
    );
  });

  test("compact strips spaces and dashes", () => {
    expect(ph.philid.compact("1234-5678901-2")).toBe(
      "123456789012",
    );
    expect(ph.philid.compact("1234 5678901 2")).toBe(
      "123456789012",
    );
  });

  // ─── Metadata ─────────────────────────────────

  test("metadata", () => {
    expect(ph.philid.abbreviation).toBe("PhilID");
    expect(ph.philid.country).toBe("PH");
    expect(ph.philid.entityType).toBe("person");
    expect(ph.philid.sourceUrl).toBeDefined();
  });
});
