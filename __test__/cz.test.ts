import { describe, expect, test } from "bun:test";

import { cz } from "../src";

// ─── IČO ─────────────────────────────────────

describe("cz.ico", () => {
  const valid = [
    "25123891", // from stdnum-js
    "25596641",
    "27074358",
    "00023272", // leading zeros
    "48207926",
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = cz.ico.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  const invalid = [
    "12345678", // bad checksum
    "1234567", // too short
    "123456789", // too long
    "abcdefgh", // not digits
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = cz.ico.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("compact strips spaces and dashes", () => {
    expect(cz.ico.compact("255 966 41")).toBe("25596641");
    expect(cz.ico.compact("2559-6641")).toBe("25596641");
  });

  test("handles Unicode artifacts", () => {
    // Non-breaking space
    const r = cz.ico.validate("2559\u00A06641");
    expect(r.valid).toBe(true);
  });

  test("metadata", () => {
    expect(cz.ico.abbreviation).toBe("IČO");
    expect(cz.ico.country).toBe("CZ");
    expect(cz.ico.entityType).toBe("company");
  });
});

// ─── RČ (Birth Number) ──────────────────────

describe("cz.rc", () => {
  test("valid 10-digit male", () => {
    const r = cz.rc.validate("7103192745");
    expect(r.valid).toBe(true);
  });

  test("valid with slash separator", () => {
    const r = cz.rc.validate("710319/2745");
    expect(r.valid).toBe(true);
  });

  test("valid 9-digit pre-1954", () => {
    const r = cz.rc.validate("991231123");
    expect(r.valid).toBe(true);
  });

  test("rejects 9-digit numbers using modern +20 month overflow", () => {
    const r = cz.rc.validate("913216323");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid component (bad date)", () => {
    const r = cz.rc.validate("1103492745");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid length", () => {
    const r = cz.rc.validate("590312/12");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid checksum", () => {
    const r = cz.rc.validate("7103192746");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("format adds slash", () => {
    expect(cz.rc.format("7103192745")).toBe("710319/2745");
  });

  test("metadata", () => {
    expect(cz.rc.abbreviation).toBe("RČ");
    expect(cz.rc.country).toBe("CZ");
    expect(cz.rc.entityType).toBe("person");
  });
});

// ─── DIČ ─────────────────────────────────────

describe("cz.dic", () => {
  test("valid 8-digit company DIČ", () => {
    const r = cz.dic.validate("CZ25123891");
    expect(r.valid).toBe(true);
  });

  test("valid without CZ prefix", () => {
    const r = cz.dic.validate("25123891");
    expect(r.valid).toBe(true);
  });

  test("8-digit starting with 9 rejected", () => {
    const r = cz.dic.validate("CZ91234567");
    expect(r.valid).toBe(false);
  });

  test("valid birth number as DIČ", () => {
    const r = cz.dic.validate("CZ7103192745");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = cz.dic.validate("CZ25123890");
    expect(r.valid).toBe(false);
  });

  test("format adds CZ prefix", () => {
    expect(cz.dic.format("25123891")).toBe("CZ25123891");
  });

  test("metadata", () => {
    expect(cz.dic.abbreviation).toBe("DIČ");
    expect(cz.dic.entityType).toBe("any");
  });
});
