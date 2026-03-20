import { describe, expect, test } from "bun:test";

import { jp } from "../src";

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
