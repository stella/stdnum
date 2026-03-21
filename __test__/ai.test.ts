import { describe, expect, test } from "bun:test";

import { ai } from "../src";

describe("ai.tin", () => {
  test("valid individual TIN (compact)", () => {
    const r = ai.tin.validate("1234567890");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("1234567890");
  });

  test("valid individual TIN (formatted)", () => {
    const r = ai.tin.validate("12345-67890");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("1234567890");
  });

  test("valid business TIN (prefix 2)", () => {
    const r = ai.tin.validate("2345678901");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("2345678901");
  });

  test("valid with spaces", () => {
    const r = ai.tin.validate("1 234 567 890");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("1234567890");
  });

  test("invalid: wrong length (too short)", () => {
    const r = ai.tin.validate("12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_LENGTH");
  });

  test("invalid: wrong length (too long)", () => {
    const r = ai.tin.validate("12345678901");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_LENGTH");
  });

  test("invalid: contains letters", () => {
    const r = ai.tin.validate("12345A6789");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_FORMAT");
  });

  test("invalid: prefix not 1 or 2", () => {
    const r = ai.tin.validate("3234567890");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_COMPONENT");
  });

  test("invalid: prefix 0", () => {
    const r = ai.tin.validate("0234567890");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_COMPONENT");
  });

  test("format adds hyphen", () => {
    expect(ai.tin.format("1234567890")).toBe("12345-67890");
  });

  test("compact strips separators", () => {
    expect(ai.tin.compact("12345-67890")).toBe("1234567890");
  });

  test("metadata", () => {
    expect(ai.tin.abbreviation).toBe("TIN");
    expect(ai.tin.country).toBe("AI");
    expect(ai.tin.entityType).toBe("any");
  });
});
