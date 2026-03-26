import { describe, expect, test } from "bun:test";

import { sk } from "../src";

describe("sk.rc", () => {
  test("same algorithm as Czech RC", () => {
    const r = sk.rc.validate("7103192745");
    expect(r.valid).toBe(true);
  });

  test("metadata says SK", () => {
    expect(sk.rc.country).toBe("SK");
    expect(sk.rc.name).toBe("Slovak Birth Number");
  });

  test("rejects 9-digit numbers using modern +20 month overflow", () => {
    const r = sk.rc.validate("913216323");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });
});

describe("sk.dic", () => {
  test("valid Slovak VAT (10 digits, mod 11)", () => {
    // 2021853504 % 11 = 0
    const r = sk.dic.validate("SK2021853504");
    expect(r.valid).toBe(true);
  });

  test("valid without SK prefix", () => {
    const r = sk.dic.validate("2021853504");
    expect(r.valid).toBe(true);
  });

  test("invalid: not divisible by 11", () => {
    const r = sk.dic.validate("SK2021853505");
    expect(r.valid).toBe(false);
  });

  test("invalid: starts with 0", () => {
    const r = sk.dic.validate("SK0234567890");
    expect(r.valid).toBe(false);
  });

  test("format adds SK prefix", () => {
    expect(sk.dic.format("2021853504")).toBe(
      "SK2021853504",
    );
  });

  test("metadata", () => {
    expect(sk.dic.abbreviation).toBe("IČ DPH");
    expect(sk.dic.country).toBe("SK");
  });
});
