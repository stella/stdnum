import { describe, expect, test } from "bun:test";

import { mx } from "../src";

// ─── RFC ─────────────────────────────────────

describe("mx.rfc", () => {
  test("valid person RFC (13 chars)", () => {
    const r = mx.rfc.validate("GODE561231GR8");
    expect(r.valid).toBe(true);
  });
  test("valid company RFC (12 chars)", () => {
    const r = mx.rfc.validate("MAB9307148T4");
    expect(r.valid).toBe(true);
  });
  test("valid with spaces and dashes", () => {
    const r = mx.rfc.validate("GODE 561231 GR8");
    expect(r.valid).toBe(true);
  });
  test("invalid checksum", () => {
    const r = mx.rfc.validate("GODE561231GR9");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_CHECKSUM");
  });
  test("wrong length", () => {
    const r = mx.rfc.validate("GODE561231G");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });
  test("invalid format", () => {
    const r = mx.rfc.validate("1234561231GR8");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_FORMAT");
  });
  test("invalid date", () => {
    const r = mx.rfc.validate("GODE561331GR8");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_COMPONENT");
  });
  test("compact strips separators", () => {
    expect(mx.rfc.compact("GODE-561231-GR8")).toBe(
      "GODE561231GR8",
    );
  });
  test("format returns compact form", () => {
    expect(mx.rfc.format("GODE561231GR8")).toBe(
      "GODE561231GR8",
    );
  });
  test("metadata", () => {
    expect(mx.rfc.abbreviation).toBe("RFC");
    expect(mx.rfc.country).toBe("MX");
    expect(mx.rfc.entityType).toBe("any");
  });
});

// ─── CURP ────────────────────────────────────

describe("mx.curp", () => {
  test("valid CURP", () => {
    const r = mx.curp.validate("BOXW310820HNERXN09");
    expect(r.valid).toBe(true);
  });
  test("valid with spaces", () => {
    const r = mx.curp.validate("BOXW 310820 HNERXN09");
    expect(r.valid).toBe(true);
  });
  test("invalid checksum", () => {
    const r = mx.curp.validate("BOXW310820HNERXN08");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_CHECKSUM");
  });
  test("wrong length", () => {
    const r = mx.curp.validate("BOXW310820HNERXN0");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });
  test("invalid format (bad gender)", () => {
    const r = mx.curp.validate("BOXW310820XNERXN09");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_FORMAT");
  });
  test("invalid state code", () => {
    // ZZ is not a valid state; 18 chars preserved
    const r = mx.curp.validate("BOXW310820HZZRXN09");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_COMPONENT");
  });
  test("compact strips separators", () => {
    expect(mx.curp.compact("BOXW-310820-HNERXN09")).toBe(
      "BOXW310820HNERXN09",
    );
  });
  test("metadata", () => {
    expect(mx.curp.abbreviation).toBe("CURP");
    expect(mx.curp.country).toBe("MX");
    expect(mx.curp.entityType).toBe("person");
  });
});

// ─── CLABE ───────────────────────────────────

describe("mx.clabe", () => {
  test("valid CLABE", () => {
    const r = mx.clabe.validate("032180000118359719");
    expect(r.valid).toBe(true);
  });
  test("valid with spaces", () => {
    const r = mx.clabe.validate("032 180 00011835971 9");
    expect(r.valid).toBe(true);
  });
  test("invalid checksum", () => {
    const r = mx.clabe.validate("032180000118359718");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_CHECKSUM");
  });
  test("wrong length", () => {
    const r = mx.clabe.validate("03218000011835971");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });
  test("non-digit characters", () => {
    const r = mx.clabe.validate("03218000011835971A");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_FORMAT");
  });
  test("compact strips separators", () => {
    expect(mx.clabe.compact("032-180-00011835971-9")).toBe(
      "032180000118359719",
    );
  });
  test("format adds spaces", () => {
    expect(mx.clabe.format("032180000118359719")).toBe(
      "032 180 00011835971 9",
    );
  });
  test("metadata", () => {
    expect(mx.clabe.abbreviation).toBe("CLABE");
    expect(mx.clabe.country).toBe("MX");
    expect(mx.clabe.entityType).toBe("any");
  });
});
