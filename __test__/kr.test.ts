import { describe, expect, test } from "bun:test";

import { kr } from "../src";

describe("kr.brn", () => {
  const valid = [
    "1168200131",
    "2208162517",
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = kr.brn.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid with dashes", () => {
    const r = kr.brn.validate("116-82-00131");
    expect(r.valid).toBe(true);
  });

  const invalid = [
    "1168200136", // bad checksum
    "116820013", // too short
    "11682001310", // too long
    "116820013A", // non-digit
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = kr.brn.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("checksum error code", () => {
    const r = kr.brn.validate("1168200136");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("format adds dashes", () => {
    expect(kr.brn.format("1168200131")).toBe(
      "116-82-00131",
    );
  });

  test("compact strips spaces and dashes", () => {
    expect(kr.brn.compact("116-82-00131")).toBe(
      "1168200131",
    );
    expect(kr.brn.compact("116 82 00131")).toBe(
      "1168200131",
    );
  });

  test("metadata", () => {
    expect(kr.brn.abbreviation).toBe("BRN");
    expect(kr.brn.country).toBe("KR");
    expect(kr.brn.entityType).toBe("company");
  });
});
