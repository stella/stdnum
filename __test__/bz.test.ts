import { describe, expect, test } from "bun:test";

import { bz } from "../src";

describe("bz.tin", () => {
  test("valid 6-digit TIN", () => {
    const r = bz.tin.validate("000005");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("000005");
  });

  test("valid 8-digit TIN (individual suffix 10)", () => {
    const r = bz.tin.validate("00000510");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("00000510");
  });

  test("valid 8-digit TIN (company suffix 13)", () => {
    const r = bz.tin.validate("00000513");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("00000513");
  });

  test("valid 8-digit TIN (company suffix 66)", () => {
    const r = bz.tin.validate("00000566");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("00000566");
  });

  test("valid with hyphen separator", () => {
    const r = bz.tin.validate("000005-10");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("00000510");
  });

  test("valid with spaces", () => {
    const r = bz.tin.validate("000005 10");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("00000510");
  });

  test("invalid: wrong length (7 digits)", () => {
    const r = bz.tin.validate("0000051");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });

  test("invalid: wrong length (9 digits)", () => {
    const r = bz.tin.validate("000005100");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });

  test("invalid: contains letters", () => {
    const r = bz.tin.validate("00000A10");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_FORMAT");
  });

  test("invalid: bad suffix code", () => {
    const r = bz.tin.validate("00000520");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_COMPONENT");
  });

  test("format 8-digit adds hyphen", () => {
    expect(bz.tin.format("00000510")).toBe("000005-10");
  });

  test("format 6-digit returns as-is", () => {
    expect(bz.tin.format("000005")).toBe("000005");
  });

  test("compact strips separators", () => {
    expect(bz.tin.compact("000005-10")).toBe("00000510");
  });

  test("metadata", () => {
    expect(bz.tin.abbreviation).toBe("TIN");
    expect(bz.tin.country).toBe("BZ");
    expect(bz.tin.entityType).toBe("any");
  });
});
