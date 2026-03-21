import { describe, expect, test } from "bun:test";

import { bh } from "../src";

// ─── CPR (Central Population Registration) ────

describe("bh.cpr", () => {
  test("valid CPR", () => {
    const r = bh.cpr.validate("890112345");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("890112345");
    }
  });

  test("valid with dashes", () => {
    const r = bh.cpr.validate("89-01-12345");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = bh.cpr.validate("89 01 12345");
    expect(r.valid).toBe(true);
  });

  test("valid second example", () => {
    const r = bh.cpr.validate("000612345");
    expect(r.valid).toBe(true);
  });

  test("wrong length (too short)", () => {
    const r = bh.cpr.validate("89011234");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("wrong length (too long)", () => {
    const r = bh.cpr.validate("8901123456");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = bh.cpr.validate("89011234A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid birth month (00)", () => {
    const r = bh.cpr.validate("890012345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid birth month (13)", () => {
    const r = bh.cpr.validate("891312345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("format adds dashes", () => {
    expect(bh.cpr.format("890112345")).toBe(
      "89-01-12345",
    );
  });

  test("compact strips separators", () => {
    expect(bh.cpr.compact("89-01-12345")).toBe(
      "890112345",
    );
  });

  test("metadata", () => {
    expect(bh.cpr.abbreviation).toBe("CPR");
    expect(bh.cpr.country).toBe("BH");
    expect(bh.cpr.entityType).toBe("person");
  });
});
