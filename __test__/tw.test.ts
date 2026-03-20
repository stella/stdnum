import { describe, expect, test } from "bun:test";

import { tw } from "../src";

describe("tw.ubn", () => {
  const valid = [
    "00501503",
    "04595257",
    "10458575",
    "22099131",
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = tw.ubn.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  const invalid = [
    "00501502", // bad checksum
    "1234567", // too short (7)
    "123456789", // too long (9)
    "0050150A", // non-digit
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = tw.ubn.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("special case: 7th digit is 7", () => {
    const r = tw.ubn.validate("10458575");
    expect(r.valid).toBe(true);
  });

  test("checksum error code", () => {
    const r = tw.ubn.validate("00501502");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("compact strips spaces and dashes", () => {
    expect(tw.ubn.compact("0050 1503")).toBe(
      "00501503",
    );
    expect(tw.ubn.compact("0050-1503")).toBe(
      "00501503",
    );
  });

  test("generate produces valid UBN", () => {
    for (let i = 0; i < 20; i++) {
      const n = tw.ubn.generate!();
      const r = tw.ubn.validate(n);
      expect(r.valid).toBe(true);
    }
  });

  test("metadata", () => {
    expect(tw.ubn.abbreviation).toBe("UBN");
    expect(tw.ubn.country).toBe("TW");
    expect(tw.ubn.entityType).toBe("company");
  });
});
