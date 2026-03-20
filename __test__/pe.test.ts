import { describe, expect, test } from "bun:test";

import { pe } from "../src";

// ─── RUC ─────────────────────────────────────

describe("pe.ruc", () => {
  test("valid RUC (company)", () => {
    const r = pe.ruc.validate("20131312955");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("20131312955");
    }
  });

  test("valid RUC (person)", () => {
    const r = pe.ruc.validate("10100000003");
    expect(r.valid).toBe(true);
  });

  test("valid RUC with separators", () => {
    const r = pe.ruc.validate("20-131312955");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("20131312955");
    }
  });

  test("invalid checksum", () => {
    const r = pe.ruc.validate("20131312956");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = pe.ruc.validate("2013131295");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = pe.ruc.validate("2013131295A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid type prefix", () => {
    const r = pe.ruc.validate("30131312955");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("format returns compact form", () => {
    expect(pe.ruc.format("20131312955")).toBe(
      "20131312955",
    );
  });

  test("compact strips separators", () => {
    expect(pe.ruc.compact("20-131312955")).toBe(
      "20131312955",
    );
  });

  test("metadata", () => {
    expect(pe.ruc.abbreviation).toBe("RUC");
    expect(pe.ruc.country).toBe("PE");
    expect(pe.ruc.entityType).toBe("any");
  });

  test("examples are all valid", () => {
    for (const ex of pe.ruc.examples ?? []) {
      const r = pe.ruc.validate(ex);
      expect(r.valid).toBe(true);
    }
  });
});
