import { describe, expect, test } from "bun:test";

import { ni } from "../src";

describe("ni.ruc", () => {
  const valid = [
    "6071904680001F",
    "281-150585-0012D",
    "041-200975-0003L",
    "0010101900001N", // municipality 001
    "J1310000252297", // legal entity
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = ni.ruc.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  const invalid = [
    "6071904680001A", // bad check letter
    "12345678901234", // all digits, wrong check
    "607190468000", // too short (12)
    "60719046800001FF", // too long
    "ABCDEFGHIJKLMN", // all letters
    "0010019000001Z", // Z not in alphabet
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = ni.ruc.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("checksum error code", () => {
    const r = ni.ruc.validate("6071904680001A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("length error code", () => {
    const r = ni.ruc.validate("607190468000");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid date component", () => {
    // month 13 is invalid
    const r = ni.ruc.validate("0013213900001X");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("compact strips hyphens and spaces", () => {
    expect(ni.ruc.compact("607-190468-0001F")).toBe(
      "6071904680001F",
    );
    expect(ni.ruc.compact("281 150585 0012D")).toBe(
      "2811505850012D",
    );
  });

  test("format adds hyphens for natural person", () => {
    expect(ni.ruc.format("6071904680001F")).toBe(
      "607-190468-0001F",
    );
  });

  test("format adds hyphen for legal entity", () => {
    expect(ni.ruc.format("J1310000252297")).toBe(
      "J-1310000252297",
    );
  });

  test("metadata", () => {
    expect(ni.ruc.abbreviation).toBe("RUC");
    expect(ni.ruc.country).toBe("NI");
    expect(ni.ruc.entityType).toBe("any");
  });
});
