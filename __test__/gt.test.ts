import { describe, expect, test } from "bun:test";

import { gt } from "../src";

describe("gt.nit", () => {
  const valid = [
    "576937-K",
    "7108-0",
    "39525503",
    "1245535-0",
    "1251368-7",
    "115203-3",
    "29010438",
    "3213463",
    "36728519",
    "4863461",
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = gt.nit.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  const invalid = [
    "8170266-0", // bad checksum
    "1234567890123", // too long
    "1", // too short
    "FF12", // non-digit body
    "12D", // invalid check char
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = gt.nit.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("checksum error code", () => {
    const r = gt.nit.validate("8170266-0");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("length error code", () => {
    const r = gt.nit.validate("1234567890123");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("compact strips hyphens and leading zeros", () => {
    expect(gt.nit.compact("0576937-K")).toBe("576937K");
    expect(gt.nit.compact("007108-0")).toBe("71080");
  });

  test("format adds hyphen before check", () => {
    expect(gt.nit.format("576937K")).toBe("576937-K");
    expect(gt.nit.format("39525503")).toBe("3952550-3");
  });

  test("generate produces valid NIT", () => {
    for (let i = 0; i < 20; i++) {
      const n = gt.nit.generate!();
      const r = gt.nit.validate(n);
      expect(r.valid).toBe(true);
    }
  });

  test("metadata", () => {
    expect(gt.nit.abbreviation).toBe("NIT");
    expect(gt.nit.country).toBe("GT");
    expect(gt.nit.entityType).toBe("any");
  });
});
