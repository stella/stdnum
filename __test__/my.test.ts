import { describe, expect, test } from "bun:test";

import { my } from "../src";
import { parse } from "../src/my/nric";

describe("my.nric", () => {
  const valid = [
    "770305021234",
    "880715141234",
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = my.nric.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid with dashes", () => {
    const r = my.nric.validate("770305-02-1234");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = my.nric.validate("770305 02 1234");
    expect(r.valid).toBe(true);
  });

  const invalid = [
    "77030502123", // too short (11 digits)
    "7703050212345", // too long (13 digits)
    "77030502123A", // non-digit
    "771305021234", // invalid month (13)
    "770332021234", // invalid day (32)
    "770305001234", // invalid PB code (00)
    "770305171234", // invalid PB code (17)
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = my.nric.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("invalid date error code", () => {
    const r = my.nric.validate("771305021234");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe(
        "INVALID_COMPONENT",
      );
    }
  });

  test("invalid PB code error code", () => {
    const r = my.nric.validate("770305001234");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe(
        "INVALID_COMPONENT",
      );
    }
  });

  test("format adds dashes", () => {
    expect(my.nric.format("770305021234")).toBe(
      "770305-02-1234",
    );
  });

  test("compact strips spaces and dashes", () => {
    expect(
      my.nric.compact("770305-02-1234"),
    ).toBe("770305021234");
    expect(
      my.nric.compact("770305 02 1234"),
    ).toBe("770305021234");
  });

  test("metadata", () => {
    expect(my.nric.abbreviation).toBe("NRIC");
    expect(my.nric.country).toBe("MY");
    expect(my.nric.entityType).toBe("person");
  });
});

describe("my.nric parse", () => {
  test("parses male", () => {
    const p = parse("770305021231");
    expect(p).not.toBeNull();
    expect(p!.gender).toBe("male");
    expect(p!.birthDate.getFullYear()).toBe(1977);
    expect(p!.birthDate.getMonth()).toBe(2); // March
    expect(p!.birthDate.getDate()).toBe(5);
  });

  test("parses female", () => {
    const p = parse("880715141234");
    expect(p).not.toBeNull();
    expect(p!.gender).toBe("female");
    expect(p!.birthDate.getFullYear()).toBe(1988);
    expect(p!.birthDate.getMonth()).toBe(6); // July
    expect(p!.birthDate.getDate()).toBe(15);
  });

  test("2000s birth year", () => {
    const p = parse("100101141234");
    expect(p).not.toBeNull();
    expect(p!.birthDate.getFullYear()).toBe(2010);
  });

  test("returns null for invalid", () => {
    const p = parse("invalid");
    expect(p).toBeNull();
  });
});
