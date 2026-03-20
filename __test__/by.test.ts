import { describe, expect, test } from "bun:test";

import { by } from "../src";

describe("by.unp", () => {
  test("valid numeric UNP", () => {
    const r = by.unp.validate("200988541");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("200988541");
  });
  test("valid alphanumeric UNP", () => {
    const r = by.unp.validate("MA1953684");
    expect(r.valid).toBe(true);
  });
  test("strips UNP prefix", () => {
    const r = by.unp.validate("UNP MA1953684");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("MA1953684");
  });
  test("invalid checksum", () => {
    const r = by.unp.validate("200988542");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_CHECKSUM");
  });
  test("wrong length", () => {
    const r = by.unp.validate("20098854");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_LENGTH");
  });
  test("invalid first character", () => {
    const r = by.unp.validate("900000001");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_COMPONENT");
  });
  test("compact handles Cyrillic letters", () => {
    expect(by.unp.compact("МА1953684")).toBe("MA1953684");
  });
  test("metadata", () => {
    expect(by.unp.country).toBe("BY");
    expect(by.unp.entityType).toBe("any");
  });
});
