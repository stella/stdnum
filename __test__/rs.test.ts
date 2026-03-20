import { describe, expect, test } from "bun:test";

import { rs } from "../src";

describe("rs.pib", () => {
  test("valid PIB", () => {
    const r = rs.pib.validate("101134702");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = rs.pib.validate("101 134 702");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = rs.pib.validate("101134703");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = rs.pib.validate("12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = rs.pib.validate("10113470A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("metadata", () => {
    expect(rs.pib.country).toBe("RS");
    expect(rs.pib.entityType).toBe("any");
  });
});
