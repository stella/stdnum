import { describe, expect, test } from "bun:test";

import { ir } from "../src";

describe("ir.nid", () => {
  test("valid NID", () => {
    const r = ir.nid.validate("0932833810");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("0932833810");
    }
  });

  test("valid with separators", () => {
    const r = ir.nid.validate("093-283-3810");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("0932833810");
    }
  });

  test("valid with spaces", () => {
    const r = ir.nid.validate("093 283 3810");
    expect(r.valid).toBe(true);
  });

  test("valid with Persian digits", () => {
    // ۰۹۳۲۸۳۳۸۱۰
    const r = ir.nid.validate("۰۹۳۲۸۳۳۸۱۰");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("0932833810");
    }
  });

  test("valid with Arabic-Indic digits", () => {
    // ٠٩٣٢٨٣٣٨١٠
    const r = ir.nid.validate("٠٩٣٢٨٣٣٨١٠");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("0932833810");
    }
  });

  test("invalid: too short", () => {
    const r = ir.nid.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: too long", () => {
    const r = ir.nid.validate("09328338100");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: contains letters", () => {
    const r = ir.nid.validate("093283381A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid: all same digits", () => {
    const r = ir.nid.validate("1111111111");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid: all zeros", () => {
    const r = ir.nid.validate("0000000000");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid: bad check digit", () => {
    const r = ir.nid.validate("0932833811");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("format returns compact", () => {
    expect(ir.nid.format("093-283-3810")).toBe(
      "0932833810",
    );
  });

  test("generate produces valid NID", () => {
    for (let i = 0; i < 50; i++) {
      const id = ir.nid.generate!();
      const r = ir.nid.validate(id);
      expect(r.valid).toBe(true);
    }
  });

  test("metadata", () => {
    expect(ir.nid.abbreviation).toBe("NID");
    expect(ir.nid.country).toBe("IR");
    expect(ir.nid.entityType).toBe("person");
  });
});
