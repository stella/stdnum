import { describe, expect, test } from "bun:test";

import { lu } from "../src";

describe("lu.vat", () => {
  test("valid Luxembourg VAT", () => {
    const r = lu.vat.validate("LU15027442");
    expect(r.valid).toBe(true);
  });

  test("verify checksum: 150274 % 89 = 42", () => {
    const r = lu.vat.validate("LU15027442");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = lu.vat.validate("LU15027443");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("metadata", () => {
    expect(lu.vat.country).toBe("LU");
  });
});
