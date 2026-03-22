import { describe, expect, test } from "bun:test";

import { us } from "../src";

describe("us.rtn", () => {
  test("valid RTN (Federal Reserve Bank of NY)", () => {
    const r = us.rtn.validate("021000021");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("021000021");
  });

  test("valid RTN (Chase)", () => {
    const r = us.rtn.validate("111000025");
    expect(r.valid).toBe(true);
  });

  test("valid with dashes", () => {
    const r = us.rtn.validate("021-000-021");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = us.rtn.validate("021 000 021");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = us.rtn.validate("021000022");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = us.rtn.validate("02100002");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = us.rtn.validate("02100002A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid prefix (00)", () => {
    const r = us.rtn.validate("001000021");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid prefix (13)", () => {
    const r = us.rtn.validate("131000021");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("valid thrift prefix (21)", () => {
    // 21 is a valid thrift range prefix
    const r = us.rtn.validate("211000021");
    // May fail on checksum but should not fail on
    // prefix
    if (!r.valid) {
      expect(r.error.code).not.toBe(
        "INVALID_COMPONENT",
      );
    }
  });

  test("metadata", () => {
    expect(us.rtn.abbreviation).toBe("RTN");
    expect(us.rtn.country).toBe("US");
    expect(us.rtn.entityType).toBe("company");
  });

  test("examples are all valid", () => {
    for (const ex of us.rtn.examples ?? []) {
      const r = us.rtn.validate(ex);
      expect(r.valid).toBe(true);
    }
  });
});
