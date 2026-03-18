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
