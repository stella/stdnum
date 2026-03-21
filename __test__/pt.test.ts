import { describe, expect, test } from "bun:test";

import { pt } from "../src";

describe("pt.vat", () => {
  test("valid Portuguese VAT", () => {
    const r = pt.vat.validate("PT501964843");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = pt.vat.validate("PT501964844");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("cannot start with 0", () => {
    const r = pt.vat.validate("PT012345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("metadata", () => {
    expect(pt.vat.country).toBe("PT");
  });
});

// ─── CC (Cartão de Cidadão) ────────────────

describe("pt.cc", () => {
  test("valid: 000000000ZZ4", () => {
    const r = pt.cc.validate("000000000ZZ4");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = pt.cc.validate("00000000 0 ZZ4");
    expect(r.valid).toBe(true);
  });

  test("wrong length", () => {
    const r = pt.cc.validate("0000000ZZ4");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid format (letter in digit positions)", () => {
    const r = pt.cc.validate("00000000AZZ4");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("bad check digit", () => {
    const r = pt.cc.validate("000000000ZZ3");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("format adds spaces", () => {
    expect(pt.cc.format("000000000ZZ4")).toBe(
      "00000000 0 ZZ4",
    );
  });

  test("compact strips spaces", () => {
    expect(pt.cc.compact("00000000 0 ZZ4")).toBe(
      "000000000ZZ4",
    );
  });

  test("metadata", () => {
    expect(pt.cc.abbreviation).toBe("CC");
    expect(pt.cc.country).toBe("PT");
    expect(pt.cc.entityType).toBe("person");
  });
});
