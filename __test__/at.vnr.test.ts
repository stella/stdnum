import { describe, expect, test } from "bun:test";

import { at } from "../src";

describe("at.vnr", () => {
  test("valid VNR", () => {
    const r = at.vnr.validate("1237010180");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("1237010180");
  });

  test("valid with spaces", () => {
    const r = at.vnr.validate("1237 010180");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = at.vnr.validate("1238010180");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = at.vnr.validate("123701018");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = at.vnr.validate("123701018A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid birth date (month > 12)", () => {
    const r = at.vnr.validate("1237011380");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid birth date (day 0)", () => {
    const r = at.vnr.validate("1237000180");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("format adds space", () => {
    expect(at.vnr.format("1237010180")).toBe(
      "1237 010180",
    );
  });

  test("metadata", () => {
    expect(at.vnr.abbreviation).toBe("VNR");
    expect(at.vnr.country).toBe("AT");
    expect(at.vnr.entityType).toBe("person");
  });

  test("examples are all valid", () => {
    for (const ex of at.vnr.examples ?? []) {
      const r = at.vnr.validate(ex);
      expect(r.valid).toBe(true);
    }
  });
});
