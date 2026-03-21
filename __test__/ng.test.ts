import { describe, expect, test } from "bun:test";

import { ng } from "../src";

// ─── NIN (National Identification Number) ─────

describe("ng.nin", () => {
  test("valid NIN", () => {
    const r = ng.nin.validate("13478900989");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("13478900989");
    }
  });

  test("valid with spaces", () => {
    const r = ng.nin.validate("134 7890 0989");
    expect(r.valid).toBe(true);
  });

  test("valid with dashes", () => {
    const r = ng.nin.validate("134-7890-0989");
    expect(r.valid).toBe(true);
  });

  test("wrong length (too short)", () => {
    const r = ng.nin.validate("1347890098");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("wrong length (too long)", () => {
    const r = ng.nin.validate("134789009890");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = ng.nin.validate("1347890A989");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format adds spaces", () => {
    expect(ng.nin.format("13478900989")).toBe(
      "134 7890 0989",
    );
  });

  test("compact strips separators", () => {
    expect(ng.nin.compact("134 7890 0989")).toBe(
      "13478900989",
    );
  });

  test("metadata", () => {
    expect(ng.nin.abbreviation).toBe("NIN");
    expect(ng.nin.country).toBe("NG");
    expect(ng.nin.entityType).toBe("person");
  });
});
