import { describe, expect, test } from "bun:test";

import { uy } from "../src";

describe("uy.rut", () => {
  test("valid RUT", () => {
    const r = uy.rut.validate("010100010013");
    expect(r.valid).toBe(true);
  });
  test("valid RUT (another)", () => {
    const r = uy.rut.validate("102000010017");
    expect(r.valid).toBe(true);
  });
  test("valid RUT (doc type 21)", () => {
    const r = uy.rut.validate("210000010014");
    expect(r.valid).toBe(true);
  });
  test("valid with dashes", () => {
    const r = uy.rut.validate("01-010001-001-3");
    expect(r.valid).toBe(true);
  });
  test("valid with UY prefix", () => {
    const r = uy.rut.validate("UY010100010013");
    expect(r.valid).toBe(true);
  });
  test("invalid checksum", () => {
    const r = uy.rut.validate("010100010012");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_CHECKSUM");
  });
  test("wrong length", () => {
    const r = uy.rut.validate("01010001001");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_LENGTH");
  });
  test("non-digit characters", () => {
    const r = uy.rut.validate("01010001001A");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_FORMAT");
  });
  test("invalid document type (00)", () => {
    const r = uy.rut.validate("000100010013");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_COMPONENT");
  });
  test("invalid document type (> 21)", () => {
    const r = uy.rut.validate("220100010013");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_COMPONENT");
  });
  test("all-zero sequence", () => {
    const r = uy.rut.validate("010000000013");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_COMPONENT");
  });
  test("compact strips separators", () => {
    expect(uy.rut.compact("01-010001-001-3")).toBe("010100010013");
  });
  test("compact strips UY prefix", () => {
    expect(uy.rut.compact("UY010100010013")).toBe("010100010013");
  });
  test("format adds separators", () => {
    expect(uy.rut.format("010100010013")).toBe("01-010001-001-3");
  });
  test("metadata", () => {
    expect(uy.rut.abbreviation).toBe("RUT");
    expect(uy.rut.country).toBe("UY");
    expect(uy.rut.entityType).toBe("any");
  });
});
