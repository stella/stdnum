import { describe, expect, test } from "bun:test";

import { th } from "../src";

describe("th.tin", () => {
  const valid = [
    "1101700230708",
    "3100600445015",
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

  test("valid 10-digit company", () => {
    const r = th.tin.validate("0123456789");
    expect(r.valid).toBe(true);
  });

  const invalid = [
    "1101700230706", // bad checksum
    "9101700230705", // first digit 9 (individual)
    "0101700230705", // first digit 0 (individual)
    "12345", // too short
    "11017002307050", // too long
    "110170023070A", // non-digit
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

  test("format 13-digit", () => {
    expect(th.tin.format("1101700230708")).toBe(
      "1 1017 00230 70 8",
    );
  });

  test("format 10-digit company", () => {
    expect(th.tin.format("0123456789")).toBe(
      "0123 45678 9",
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
