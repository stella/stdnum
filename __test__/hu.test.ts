import { describe, expect, test } from "bun:test";

import { hu } from "../src";

describe("hu.vat", () => {
  test("valid Hungarian VAT", () => {
    const r = hu.vat.validate("HU12892312");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = hu.vat.validate("HU12892313");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("metadata", () => {
    expect(hu.vat.country).toBe("HU");
  });
});
