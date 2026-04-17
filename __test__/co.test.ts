import { describe, expect, test } from "bun:test";

import { co } from "../src";

describe("co.nit", () => {
  const valid = [
    "2131234321",
    "8001234565",
    "213.123.432-1", // formatted
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = co.nit.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  const invalid = [
    "2131234325", // bad checksum
    "1234567", // too short (7)
    "213123432A", // non-digit
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = co.nit.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("checksum error code", () => {
    const r = co.nit.validate("2131234325");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("compact strips separators", () => {
    expect(co.nit.compact("213.123.432-1")).toBe(
      "2131234321",
    );
    expect(co.nit.compact("213 123 432 1")).toBe(
      "2131234321",
    );
  });

  test("format adds dots and dash", () => {
    expect(co.nit.format("2131234321")).toBe(
      "213.123.432-1",
    );
    expect(co.nit.format("8001234565")).toBe(
      "800.123.456-5",
    );
  });

  test("generate produces valid NIT", () => {
    for (let i = 0; i < 20; i++) {
      const n = co.nit.generate!();
      const r = co.nit.validate(n);
      expect(r.valid).toBe(true);
    }
  });

  test("metadata", () => {
    expect(co.nit.abbreviation).toBe("NIT");
    expect(co.nit.country).toBe("CO");
    expect(co.nit.entityType).toBe("any");
  });
});
