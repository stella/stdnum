import { describe, expect, test } from "bun:test";

import { th } from "../src";

describe("th.tin", () => {
  const valid = [
    "1101700230708", // individual
    "3100600445015", // individual
    "0994000617721", // company (MOA, starts with 0)
    "0105536112014", // company (MOA)
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = th.tin.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid with dashes", () => {
    const r = th.tin.validate("1-1017-00230-70-8");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = th.tin.validate(
      "1 1017 00230 70 8",
    );
    expect(r.valid).toBe(true);
  });

  test("edge case: sum%11=0 (check digit 1)", () => {
    // 0994000617721 has sum%11=0, check=(11-0)%10=1
    const r = th.tin.validate("0994000617721");
    expect(r.valid).toBe(true);
  });

  const invalid = [
    "1101700230706", // bad checksum
    "9101700230705", // first digit 9
    "12345", // too short
    "11017002307050", // too long
    "110170023070A", // non-digit
    "0123456789", // 10 digits (not valid)
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = th.tin.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("checksum error code", () => {
    const r = th.tin.validate("1101700230706");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid first digit error code", () => {
    const r = th.tin.validate("9101700230700");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe(
        "INVALID_COMPONENT",
      );
    }
  });

  test("10-digit number rejected", () => {
    const r = th.tin.validate("0123456789");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format", () => {
    expect(th.tin.format("1101700230708")).toBe(
      "1 1017 00230 70 8",
    );
  });

  test("format company TIN", () => {
    expect(th.tin.format("0994000617721")).toBe(
      "0 9940 00617 72 1",
    );
  });

  test("compact strips spaces and dashes", () => {
    expect(
      th.tin.compact("1-1017-00230-70-8"),
    ).toBe("1101700230708");
    expect(
      th.tin.compact("1 1017 00230 70 8"),
    ).toBe("1101700230708");
  });

  test("metadata", () => {
    expect(th.tin.abbreviation).toBe("TIN");
    expect(th.tin.country).toBe("TH");
    expect(th.tin.entityType).toBe("any");
  });
});
