import { describe, expect, test } from "bun:test";

import { ad } from "../src";

describe("ad.nrt", () => {
  test("valid NRT with separators", () => {
    const r = ad.nrt.validate("U-132950-X");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("U132950X");
  });
  test("valid NRT compact form", () => {
    const r = ad.nrt.validate("D059888N");
    expect(r.valid).toBe(true);
  });
  test("valid F-type", () => {
    const r = ad.nrt.validate("F123456M");
    expect(r.valid).toBe(true);
  });
  test("invalid prefix letter I", () => {
    const r = ad.nrt.validate("I706193G");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_COMPONENT");
  });
  test("invalid length", () => {
    const r = ad.nrt.validate("A123B");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_LENGTH");
  });
  test("F-type digits too high", () => {
    const r = ad.nrt.validate("F700000A");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_COMPONENT");
  });
  test("A-type accepts digits in range 700000-799999", () => {
    const r1 = ad.nrt.validate("A700000B");
    expect(r1.valid).toBe(true);
    const r2 = ad.nrt.validate("A799999B");
    expect(r2.valid).toBe(true);
  });
  test("A-type rejects digits outside 700000-799999", () => {
    const r = ad.nrt.validate("A123456B");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_COMPONENT");
  });
  test("format adds separators", () => {
    expect(ad.nrt.format("D059888N")).toBe("D-059888-N");
  });
  test("compact strips separators", () => {
    expect(ad.nrt.compact("U-132950-X")).toBe("U132950X");
  });
  test("metadata", () => {
    expect(ad.nrt.country).toBe("AD");
    expect(ad.nrt.entityType).toBe("any");
    expect(ad.nrt.abbreviation).toBe("NRT");
  });
});
