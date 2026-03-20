import { describe, expect, test } from "bun:test";

import { id } from "../src";

// ─── NPWP (Nomor Pokok Wajib Pajak) ──────────

describe("id.npwp", () => {
  test("valid NPWP", () => {
    const r = id.npwp.validate("013000666091000");
    expect(r.valid).toBe(true);
  });

  test("valid with dots and dash", () => {
    const r = id.npwp.validate(
      "01.300.066.6-091.000",
    );
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = id.npwp.validate(
      "01 300 066 6 091 000",
    );
    expect(r.valid).toBe(true);
  });

  test("another valid NPWP", () => {
    const r = id.npwp.validate("013001238091000");
    expect(r.valid).toBe(true);
  });

  test("wrong length (too short)", () => {
    const r = id.npwp.validate("01300066609100");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("wrong length (too long)", () => {
    const r = id.npwp.validate("0130006660910001");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = id.npwp.validate("01300066609100A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format adds dots and dash", () => {
    expect(id.npwp.format("013000666091000")).toBe(
      "01.300.066.6-091.000",
    );
  });

  test("compact strips separators", () => {
    expect(
      id.npwp.compact("01.300.066.6-091.000"),
    ).toBe("013000666091000");
  });

  test("metadata", () => {
    expect(id.npwp.abbreviation).toBe("NPWP");
    expect(id.npwp.country).toBe("ID");
    expect(id.npwp.entityType).toBe("any");
  });
});
