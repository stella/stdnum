import { describe, expect, test } from "bun:test";

import { kw } from "../src";

// ─── Civil Number (الرقم المدني) ──────────────

describe("kw.civil", () => {
  test("valid civil number", () => {
    const r = kw.civil.validate("289011200032");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("289011200032");
    }
  });

  test("valid second example", () => {
    const r = kw.civil.validate("305031512348");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = kw.civil.validate("2 890112 0003 2");
    expect(r.valid).toBe(true);
  });

  test("valid with dashes", () => {
    const r = kw.civil.validate("2-890112-0003-2");
    expect(r.valid).toBe(true);
  });

  test("wrong length (too short)", () => {
    const r = kw.civil.validate("28901120003");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("wrong length (too long)", () => {
    const r = kw.civil.validate("2890112000321");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = kw.civil.validate("28901120003A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid century digit", () => {
    const r = kw.civil.validate("189011200032");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid birth date (month 13)", () => {
    const r = kw.civil.validate("289130100032");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong check digit", () => {
    const r = kw.civil.validate("289011200033");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("format adds spaces", () => {
    expect(kw.civil.format("289011200032")).toBe(
      "2 890112 0003 2",
    );
  });

  test("compact strips separators", () => {
    expect(kw.civil.compact("2 890112 0003 2")).toBe(
      "289011200032",
    );
  });

  test("metadata", () => {
    expect(kw.civil.abbreviation).toBe("Civil ID");
    expect(kw.civil.country).toBe("KW");
    expect(kw.civil.entityType).toBe("person");
  });
});
