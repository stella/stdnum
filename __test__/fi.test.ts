import { describe, expect, test } from "bun:test";

import { fi } from "../src";

describe("fi.vat", () => {
  test("valid Finnish VAT", () => {
    const r = fi.vat.validate("FI20774740");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = fi.vat.validate("FI20774741");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("metadata", () => {
    expect(fi.vat.country).toBe("FI");
  });
});
