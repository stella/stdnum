import { describe, expect, test } from "bun:test";

import { de } from "../src";

// ─── USt-IdNr. ───────────────────────────────

describe("de.vat", () => {
  test("valid German VAT", () => {
    const r = de.vat.validate("DE136695976");
    expect(r.valid).toBe(true);
  });

  test("valid without prefix", () => {
    const r = de.vat.validate("136695976");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = de.vat.validate("DE136695978");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = de.vat.validate("DE12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds DE prefix", () => {
    expect(de.vat.format("136695976")).toBe("DE136695976");
  });

  test("metadata", () => {
    expect(de.vat.abbreviation).toBe("USt-IdNr.");
    expect(de.vat.country).toBe("DE");
    expect(de.vat.entityType).toBe("company");
  });
});

// ─── IdNr ────────────────────────────────────

describe("de.idnr", () => {
  test("valid German IdNr", () => {
    const r = de.idnr.validate("36574261809");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = de.idnr.validate("36 574 261 809");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = de.idnr.validate("36574261808");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = de.idnr.validate("1234567890");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format spaces", () => {
    expect(de.idnr.format("36574261809")).toBe(
      "36 574 261 809",
    );
  });

  test("metadata", () => {
    expect(de.idnr.abbreviation).toBe("IdNr");
    expect(de.idnr.country).toBe("DE");
    expect(de.idnr.entityType).toBe("person");
  });
});
