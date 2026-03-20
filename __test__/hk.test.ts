import { describe, expect, test } from "bun:test";

import { hk } from "../src";

// ─── HKID (Hong Kong Identity Card) ──────────

describe("hk.hkid", () => {
  test("valid single-letter prefix", () => {
    const r = hk.hkid.validate("G123456A");
    expect(r.valid).toBe(true);
  });

  test("valid two-letter prefix", () => {
    const r = hk.hkid.validate("AB9876543");
    expect(r.valid).toBe(true);
  });

  test("valid with parentheses", () => {
    const r = hk.hkid.validate("G123456(A)");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces and parens", () => {
    const r = hk.hkid.validate("G 123456 (A)");
    expect(r.valid).toBe(true);
  });

  test("valid lowercase normalized", () => {
    const r = hk.hkid.validate("g123456a");
    expect(r.valid).toBe(true);
  });

  test("check digit A (remainder 1)", () => {
    const r = hk.hkid.validate("G123456A");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = hk.hkid.validate("G1234560");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length (too short)", () => {
    const r = hk.hkid.validate("G12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("wrong length (too long)", () => {
    const r = hk.hkid.validate("ABC12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid format (digits in prefix)", () => {
    const r = hk.hkid.validate("1G234567A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format adds parentheses", () => {
    expect(hk.hkid.format("G123456A")).toBe(
      "G123456(A)",
    );
  });

  test("format with two-letter prefix", () => {
    expect(hk.hkid.format("AB9876543")).toBe(
      "AB987654(3)",
    );
  });

  test("compact strips separators", () => {
    expect(hk.hkid.compact("G 123456(A)")).toBe(
      "G123456A",
    );
  });

  test("metadata", () => {
    expect(hk.hkid.abbreviation).toBe("HKID");
    expect(hk.hkid.country).toBe("HK");
    expect(hk.hkid.entityType).toBe("person");
  });
});
