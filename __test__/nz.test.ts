import { describe, expect, test } from "bun:test";

import { nz } from "../src";

describe("nz.ird", () => {
  test("valid 8-digit IRD", () => {
    const r = nz.ird.validate("49091850");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("49091850");
  });

  test("valid IRD with separators", () => {
    const r = nz.ird.validate("4909185-0");
    expect(r.valid).toBe(true);
  });

  test("valid IRD with NZ prefix", () => {
    const r = nz.ird.validate("NZ 49-098-576");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("49098576");
  });

  test("valid 9-digit IRD", () => {
    const r = nz.ird.validate("136410132");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("136410132");
  });

  test("invalid checksum", () => {
    const r = nz.ird.validate("136410133");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length (too short)", () => {
    const r = nz.ird.validate("9125568");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("wrong length (too long)", () => {
    const r = nz.ird.validate("1364101320");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("accepts lower boundary (10,000,000)", () => {
    // 10000000 is the minimum valid IRD number;
    // may fail checksum but must not fail range check
    const r = nz.ird.validate("10000000");
    if (!r.valid) {
      expect(r.error.code).not.toBe("INVALID_COMPONENT");
    }
  });

  test("out of range (too small)", () => {
    const r = nz.ird.validate("09999999");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("non-digit", () => {
    const r = nz.ird.validate("4909185A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format 8-digit", () => {
    expect(nz.ird.format("49091850")).toBe("49-091-850");
  });

  test("format 9-digit", () => {
    expect(nz.ird.format("136410132")).toBe("136-410-132");
  });

  test("metadata", () => {
    expect(nz.ird.country).toBe("NZ");
    expect(nz.ird.entityType).toBe("any");
  });
});
