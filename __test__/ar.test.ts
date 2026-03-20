import { describe, expect, test } from "bun:test";

import { ar } from "../src";

// ─── CUIT ────────────────────────────────────

describe("ar.cuit", () => {
  test("valid CUIT with separators", () => {
    const r = ar.cuit.validate("20-26756539-3");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("20267565393");
    }
  });

  test("valid CUIT without separators", () => {
    const r = ar.cuit.validate("20267565393");
    expect(r.valid).toBe(true);
  });

  test("valid company CUIT (type 30)", () => {
    const r = ar.cuit.validate("30-10000001-2");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("30100000012");
    }
  });

  test("valid CUIT with spaces", () => {
    const r = ar.cuit.validate("20 26756539 3");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = ar.cuit.validate("20267565394");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = ar.cuit.validate("2026756539");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = ar.cuit.validate("2026756539A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid type code", () => {
    const r = ar.cuit.validate("11267565393");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("format adds separators", () => {
    expect(ar.cuit.format("20267565393")).toBe(
      "20-26756539-3",
    );
  });

  test("compact strips separators", () => {
    expect(ar.cuit.compact("20-26756539-3")).toBe(
      "20267565393",
    );
  });

  test("metadata", () => {
    expect(ar.cuit.abbreviation).toBe("CUIT");
    expect(ar.cuit.country).toBe("AR");
    expect(ar.cuit.entityType).toBe("any");
  });

  test("examples are all valid", () => {
    for (const ex of ar.cuit.examples ?? []) {
      const r = ar.cuit.validate(ex);
      expect(r.valid).toBe(true);
    }
  });
});
