import { describe, expect, test } from "bun:test";

import { is_ } from "../src";

// ─── Kennitala (ID Number) ──────────────────

describe("is.kennitala", () => {
  test("valid personal kennitala", () => {
    const r = is_.kennitala.validate("4504013150");
    expect(r.valid).toBe(true);
  });

  test("valid kennitala (1900s century)", () => {
    const r = is_.kennitala.validate("1201743399");
    expect(r.valid).toBe(true);
  });

  test("valid with separator", () => {
    const r = is_.kennitala.validate("450401-3150");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = is_.kennitala.validate("5305750299");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = is_.kennitala.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds dash", () => {
    expect(is_.kennitala.format("4504013150")).toBe(
      "450401-3150",
    );
  });

  test("metadata", () => {
    expect(is_.kennitala.country).toBe("IS");
    expect(is_.kennitala.entityType).toBe("any");
  });
});

// ─── VSK (VAT) ──────────────────────────────

describe("is.vsk", () => {
  test("valid 5-digit VSK", () => {
    const r = is_.vsk.validate("00621");
    expect(r.valid).toBe(true);
  });

  test("valid 6-digit VSK", () => {
    const r = is_.vsk.validate("123456");
    expect(r.valid).toBe(true);
  });

  test("invalid length (7 digits)", () => {
    const r = is_.vsk.validate("0062199");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digits", () => {
    const r = is_.vsk.validate("abcde");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("metadata", () => {
    expect(is_.vsk.country).toBe("IS");
    expect(is_.vsk.entityType).toBe("company");
  });
});
