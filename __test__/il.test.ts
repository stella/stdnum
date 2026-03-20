import { describe, expect, test } from "bun:test";

import { il } from "../src";

describe("il.idnr", () => {
  test("valid ID (zero-padded)", () => {
    const r = il.idnr.validate("039337423");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("039337423");
  });

  test("valid ID without leading zeros", () => {
    const r = il.idnr.validate("39337423");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("039337423");
  });

  test("valid ID with separators", () => {
    const r = il.idnr.validate("3933742-3");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("039337423");
  });

  test("valid minimal ID", () => {
    const r = il.idnr.validate("000000018");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = il.idnr.validate("039337422");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("too long", () => {
    const r = il.idnr.validate("0393374230");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("all zeros rejected", () => {
    const r = il.idnr.validate("000000000");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("non-digit", () => {
    const r = il.idnr.validate("03933742A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format adds separator", () => {
    expect(il.idnr.format("39337423")).toBe(
      "03933742-3",
    );
  });

  test("metadata", () => {
    expect(il.idnr.country).toBe("IL");
    expect(il.idnr.entityType).toBe("person");
  });
});
