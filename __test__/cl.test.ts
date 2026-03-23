import { describe, expect, test } from "bun:test";

import { cl } from "../src";

// ─── RUT ─────────────────────────────────────

describe("cl.rut", () => {
  test("valid RUT with separators", () => {
    const r = cl.rut.validate("76.086.428-5");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("760864285");
    }
  });

  test("valid RUT without separators", () => {
    const r = cl.rut.validate("760864285");
    expect(r.valid).toBe(true);
  });

  test("valid RUT with K check digit", () => {
    const r = cl.rut.validate("10.000.013-K");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("10000013K");
    }
  });

  test("valid RUT with lowercase k", () => {
    const r = cl.rut.validate("10.000.013-k");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = cl.rut.validate("76.086.428-6");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length (too long)", () => {
    const r = cl.rut.validate("1234567890");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("wrong length (too short)", () => {
    const r = cl.rut.validate("1");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = cl.rut.validate("7608642A5");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("valid RUT with CL prefix", () => {
    const r = cl.rut.validate("CL 12531909-2");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("125319092");
    }
  });

  test("format adds separators", () => {
    expect(cl.rut.format("760864285")).toBe("76.086.428-5");
  });

  test("format round-trips with compact (8-digit body)", () => {
    const formatted = cl.rut.format("125319092");
    expect(formatted).toBe("12.531.909-2");
    expect(cl.rut.compact(formatted)).toBe("125319092");
  });

  test("format round-trips with compact (7-digit body)", () => {
    const formatted = cl.rut.format("12345674");
    expect(formatted).toBe("1.234.567-4");
    expect(cl.rut.compact(formatted)).toBe("12345674");
  });

  test("compact strips separators", () => {
    expect(cl.rut.compact("76.086.428-5")).toBe(
      "760864285",
    );
  });

  test("metadata", () => {
    expect(cl.rut.abbreviation).toBe("RUT");
    expect(cl.rut.country).toBe("CL");
    expect(cl.rut.entityType).toBe("any");
  });

  test("examples are all valid", () => {
    for (const ex of cl.rut.examples ?? []) {
      const r = cl.rut.validate(ex);
      expect(r.valid).toBe(true);
    }
  });
});
