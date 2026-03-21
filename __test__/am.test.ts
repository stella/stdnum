import { describe, expect, test } from "bun:test";

import { am } from "../src";

describe("am.tin", () => {
  test("valid TIN", () => {
    const r = am.tin.validate("01234561");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("01234561");
  });

  test("valid TIN (another)", () => {
    const r = am.tin.validate("10048376");
    expect(r.valid).toBe(true);
  });

  test("valid TIN with spaces", () => {
    const r = am.tin.validate("0123 4561");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("01234561");
  });

  test("wrong length (7 digits)", () => {
    const r = am.tin.validate("0123456");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });

  test("wrong length (9 digits)", () => {
    const r = am.tin.validate("012345678");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });

  test("non-digit characters", () => {
    const r = am.tin.validate("0123456A");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_FORMAT");
  });

  test("compact strips spaces and dashes", () => {
    expect(am.tin.compact("012-345-61")).toBe(
      "01234561",
    );
  });

  test("format returns compact form", () => {
    expect(am.tin.format("012 345 61")).toBe("01234561");
  });

  test("metadata", () => {
    expect(am.tin.abbreviation).toBe("TIN");
    expect(am.tin.country).toBe("AM");
    expect(am.tin.entityType).toBe("any");
  });
});
