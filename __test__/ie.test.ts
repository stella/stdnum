import { describe, expect, test } from "bun:test";

import { ie } from "../src";

describe("ie.vat", () => {
  test("valid new-format Irish VAT", () => {
    const r = ie.vat.validate("IE6433435F");
    expect(r.valid).toBe(true);
  });

  test("valid new-format with trailing letter", () => {
    const r = ie.vat.validate("IE6433435OA");
    expect(r.valid).toBe(true);
  });

  test("valid old-format Irish VAT", () => {
    const r = ie.vat.validate("IE8D79739I");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = ie.vat.validate("IE6433435G");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = ie.vat.validate("IE123456");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(ie.vat.country).toBe("IE");
  });
});
