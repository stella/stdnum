import { describe, expect, test } from "bun:test";

import { gb } from "../src";

describe("gb.vat", () => {
  const valid = ["980780684", "340804329", "346270013"];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = gb.vat.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid with GB prefix", () => {
    const r = gb.vat.validate("GB980780684");
    expect(r.valid).toBe(true);
  });

  test("valid government GD", () => {
    const r = gb.vat.validate("GD499");
    expect(r.valid).toBe(true);
  });

  test("invalid GD >= 500", () => {
    const r = gb.vat.validate("GD500");
    expect(r.valid).toBe(false);
  });

  test("valid health authority HA", () => {
    const r = gb.vat.validate("HA500");
    expect(r.valid).toBe(true);
  });

  test("invalid HA < 500", () => {
    const r = gb.vat.validate("HA499");
    expect(r.valid).toBe(false);
  });

  test("invalid checksum", () => {
    const r = gb.vat.validate("802311781");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = gb.vat.validate("12345678");
    expect(r.valid).toBe(false);
  });

  test("metadata", () => {
    expect(gb.vat.abbreviation).toBe("VAT");
    expect(gb.vat.country).toBe("GB");
  });
});

describe("gb.utr", () => {
  test("valid UTR", () => {
    const r = gb.utr.validate("1955839661");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = gb.utr.validate("2955839661");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = gb.utr.validate("12345678");
    expect(r.valid).toBe(false);
  });

  test("format", () => {
    expect(gb.utr.format("1955839661")).toBe("19558 39661");
  });

  test("metadata", () => {
    expect(gb.utr.abbreviation).toBe("UTR");
    expect(gb.utr.country).toBe("GB");
  });
});

// --- SEDOL ---------------------------------------------

describe("gb.sedol", () => {
  test("valid new-style SEDOL", () => {
    const r = gb.sedol.validate("B15KXQ8");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("B15KXQ8");
  });

  test("valid old-style numeric SEDOL", () => {
    const r = gb.sedol.validate("0263494");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = gb.sedol.validate("B 1 5 K X Q 8");
    expect(r.valid).toBe(true);
  });

  test("valid lowercase input", () => {
    const r = gb.sedol.validate("b15kxq8");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = gb.sedol.validate("B15KXQ9");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = gb.sedol.validate("B15KXQ");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid character: vowel", () => {
    const r = gb.sedol.validate("A15KXQ8");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("digit-prefix with letters is invalid", () => {
    const r = gb.sedol.validate("1B5KXQ8");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("compact uppercases", () => {
    expect(gb.sedol.compact("b15kxq8")).toBe(
      "B15KXQ8",
    );
  });

  test("format returns compact form", () => {
    expect(gb.sedol.format("b15kxq8")).toBe("B15KXQ8");
  });

  test("calcCheckDigit throws on invalid char", () => {
    const { calcCheckDigit } = require(
      "../src/gb/sedol",
    );
    expect(() => calcCheckDigit("B15AXQ")).toThrow(
      "Invalid SEDOL character",
    );
  });

  test("calcCheckDigit throws on wrong length", () => {
    const { calcCheckDigit } = require(
      "../src/gb/sedol",
    );
    expect(() => calcCheckDigit("B15KX")).toThrow(
      "6-character",
    );
  });

  test("metadata", () => {
    expect(gb.sedol.abbreviation).toBe("SEDOL");
    expect(gb.sedol.country).toBe("GB");
    expect(gb.sedol.entityType).toBe("any");
  });
});

// --- NINO ----------------------------------------------

describe("gb.nino", () => {
  test("valid NINO", () => {
    const r = gb.nino.validate("AB123456C");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = gb.nino.validate("AB 12 34 56 C");
    expect(r.valid).toBe(true);
  });

  test("valid lowercase", () => {
    const r = gb.nino.validate("ab123456c");
    expect(r.valid).toBe(true);
  });

  test("valid suffix D", () => {
    const r = gb.nino.validate("CE123456D");
    expect(r.valid).toBe(true);
  });

  test("invalid: first letter D", () => {
    const r = gb.nino.validate("DA123456A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid: first letter Q", () => {
    const r = gb.nino.validate("QA123456A");
    expect(r.valid).toBe(false);
  });

  test("invalid: second letter O", () => {
    const r = gb.nino.validate("AO123456A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid: prefix BG", () => {
    const r = gb.nino.validate("BG123456A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid: prefix GB", () => {
    const r = gb.nino.validate("GB123456A");
    expect(r.valid).toBe(false);
  });

  test("invalid: prefix NK", () => {
    const r = gb.nino.validate("NK123456A");
    expect(r.valid).toBe(false);
  });

  test("invalid: prefix ZZ", () => {
    const r = gb.nino.validate("ZZ123456A");
    expect(r.valid).toBe(false);
  });

  test("invalid: suffix E", () => {
    const r = gb.nino.validate("AB123456E");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("wrong length", () => {
    const r = gb.nino.validate("AB12345C");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds spaces", () => {
    expect(gb.nino.format("AB123456C")).toBe(
      "AB 12 34 56 C",
    );
  });

  test("metadata", () => {
    expect(gb.nino.abbreviation).toBe("NINO");
    expect(gb.nino.country).toBe("GB");
    expect(gb.nino.entityType).toBe("person");
  });
});
