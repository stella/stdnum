import { describe, expect, test } from "bun:test";

import { si } from "../src";

describe("si.vat", () => {
  test("valid Slovenian VAT", () => {
    const r = si.vat.validate("SI15012557");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = si.vat.validate("SI15012558");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("cannot start with 0", () => {
    const r = si.vat.validate("SI01234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("metadata", () => {
    expect(si.vat.country).toBe("SI");
  });
});

// ─── EMŠO (Personal ID) ────────────────────

describe("si.emso", () => {
  test("valid EMŠO", () => {
    const r = si.emso.validate("0101006500006");
    expect(r.valid).toBe(true);
  });

  test("invalid EMŠO checksum", () => {
    const r = si.emso.validate("0101006500007");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = si.emso.validate("010100650000");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("rejects register codes outside 50-59", () => {
    const r = si.emso.validate("0101006490006");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("rejects future birth dates", () => {
    const r = si.emso.validate("1312094569988");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("metadata", () => {
    expect(si.emso.country).toBe("SI");
    expect(si.emso.entityType).toBe("person");
  });
});
