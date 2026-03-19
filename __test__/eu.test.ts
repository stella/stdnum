import { describe, expect, test } from "bun:test";

import { eu } from "../src";

describe("eu.vat", () => {
  const valid = [
    "ATU13585627",
    "BE0776091951",
    "DE136695976",
    "FR40303265045",
    "NL004495445B01",
    "ES54387763P",
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = eu.vat.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("compact includes country prefix", () => {
    const r = eu.vat.validate("AT U13585627");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("ATU13585627");
    }
  });

  test("EL prefix routes to Greece", () => {
    // Greek VAT: 9-digit with mod-11 check
    const r = eu.vat.validate("EL094259216");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact.startsWith("EL")).toBe(true);
    }
  });

  test("unsupported country code", () => {
    const r = eu.vat.validate("XX123456789");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("too short input", () => {
    const r = eu.vat.validate("A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid number for valid country", () => {
    const r = eu.vat.validate("DE000000000");
    expect(r.valid).toBe(false);
  });

  test("format delegates to country", () => {
    const formatted = eu.vat.format("ATU13585627");
    expect(formatted).toBe("ATU13585627");
  });

  test("compact normalises", () => {
    expect(eu.vat.compact("BE 0776 091 951")).toBe(
      "BE0776091951",
    );
  });

  test("metadata", () => {
    expect(eu.vat.abbreviation).toBe("EU VAT");
    expect(eu.vat.entityType).toBe("company");
    expect(eu.vat.country).toBeUndefined();
  });
});
