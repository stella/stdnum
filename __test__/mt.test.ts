import { describe, expect, test } from "bun:test";

import { mt } from "../src";

describe("mt.vat", () => {
  test("valid Maltese VAT", () => {
    const r = mt.vat.validate("MT11679112");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = mt.vat.validate("MT11679113");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("cannot start with 0", () => {
    const r = mt.vat.validate("MT01234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("metadata", () => {
    expect(mt.vat.country).toBe("MT");
  });
});
