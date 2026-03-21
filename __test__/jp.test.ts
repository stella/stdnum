import { describe, expect, test } from "bun:test";

import { jp } from "../src";
import { generate } from "../src/jp/mynumber";

describe("jp.cn", () => {
  const valid = [
    "5835678256246",
    "2021001052596",
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = jp.cn.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  const invalid = [
    "5835678256247", // bad checksum
    "583567825624", // too short (12)
    "58356782562461", // too long (14)
    "583567825624A", // non-digit
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = jp.cn.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("checksum error code", () => {
    const r = jp.cn.validate("5835678256247");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("compact strips spaces and dashes", () => {
    expect(jp.cn.compact("5835 6782 56246")).toBe(
      "5835678256246",
    );
    expect(jp.cn.compact("5835-6782-56246")).toBe(
      "5835678256246",
    );
  });

  test("metadata", () => {
    expect(jp.cn.abbreviation).toBe("CN");
    expect(jp.cn.country).toBe("JP");
    expect(jp.cn.entityType).toBe("company");
  });
});

// ─── My Number ──────────────────────────────────

describe("jp.mynumber", () => {
  const valid = [
    "123456789018",
    "000000000019",
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = jp.mynumber.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid with separators", () => {
    const r = jp.mynumber.validate("1234 5678 9018");
    expect(r.valid).toBe(true);
  });

  const invalid = [
    "123456789010", // bad checksum
    "12345678901", // too short (11)
    "1234567890180", // too long (13)
    "12345678901A", // non-digit
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = jp.mynumber.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("checksum error code", () => {
    const r = jp.mynumber.validate("123456789010");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("compact strips spaces and dashes", () => {
    expect(
      jp.mynumber.compact("1234 5678 9018"),
    ).toBe("123456789018");
    expect(
      jp.mynumber.compact("1234-5678-9018"),
    ).toBe("123456789018");
  });

  test("format groups as 4-4-4", () => {
    expect(jp.mynumber.format("123456789018")).toBe(
      "1234 5678 9018",
    );
  });

  test("generate produces valid numbers", () => {
    for (let i = 0; i < 50; i++) {
      const n = generate();
      const r = jp.mynumber.validate(n);
      expect(r.valid).toBe(true);
    }
  });

  test("metadata", () => {
    expect(jp.mynumber.abbreviation).toBe("My Number");
    expect(jp.mynumber.country).toBe("JP");
    expect(jp.mynumber.entityType).toBe("person");
  });
});
