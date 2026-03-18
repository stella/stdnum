import { describe, expect, test } from "bun:test";

import { lt } from "../src";

describe("lt.vat", () => {
  test("valid 9-digit Lithuanian VAT", () => {
    const r = lt.vat.validate("LT119511515");
    expect(r.valid).toBe(true);
  });

  test("valid 12-digit Lithuanian VAT", () => {
    const r = lt.vat.validate("LT100001919017");
    expect(r.valid).toBe(true);
  });

  test("9-digit: d[7] must be 1", () => {
    const r = lt.vat.validate("LT119511525");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid checksum", () => {
    const r = lt.vat.validate("LT119511516");
    expect(r.valid).toBe(false);
  });

  test("metadata", () => {
    expect(lt.vat.country).toBe("LT");
  });
});

// ─── Asmens kodas (Personal ID) ────────────

describe("lt.asmens", () => {
  test("valid Asmens kodas", () => {
    const r = lt.asmens.validate("33309240064");
    expect(r.valid).toBe(true);
  });

  test("invalid Asmens kodas checksum", () => {
    const r = lt.asmens.validate("33309240164");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = lt.asmens.validate("3330924006");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(lt.asmens.country).toBe("LT");
    expect(lt.asmens.entityType).toBe("person");
  });
});
