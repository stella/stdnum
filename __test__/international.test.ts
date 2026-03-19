import { describe, expect, test } from "bun:test";

import { creditcard, iban, lei, luhn } from "../src";

// ─── IBAN ────────────────────────────────────

describe("iban", () => {
  const valid = [
    "GB29 NWBK 6016 1331 9268 19",
    "DE89 3704 0044 0532 0130 00",
    "CZ65 0800 0000 1920 0014 5399",
    "SK31 1200 0000 1987 4263 7541",
    "FR76 3000 6000 0112 3456 7890 189",
    "AT61 1904 3002 3457 3201",
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = iban.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid compact form", () => {
    const r = iban.validate("GB29NWBK60161331926819");
    expect(r.valid).toBe(true);
  });

  test("invalid check digits", () => {
    const r = iban.validate("GB00 NWBK 6016 1331 9268 19");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length for country", () => {
    const r = iban.validate("DE89 3704 0044");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid characters", () => {
    const r = iban.validate("GB29 NWBK 6016 !!!!");
    expect(r.valid).toBe(false);
  });

  test("compact strips spaces", () => {
    expect(
      iban.compact("GB29 NWBK 6016 1331 9268 19"),
    ).toBe("GB29NWBK60161331926819");
  });

  test("format groups by 4", () => {
    expect(iban.format("GB29NWBK60161331926819")).toBe(
      "GB29 NWBK 6016 1331 9268 19",
    );
  });

  test("handles non-breaking spaces", () => {
    const r = iban.validate(
      "GB29\u00A0NWBK\u00A06016\u00A01331\u00A09268\u00A019",
    );
    expect(r.valid).toBe(true);
  });

  test("metadata", () => {
    expect(iban.abbreviation).toBe("IBAN");
    expect(iban.country).toBeUndefined();
    expect(iban.entityType).toBe("any");
  });
});

// ─── Luhn (generic) ─────────────────────────

describe("luhn", () => {
  test("valid any length", () => {
    expect(luhn.validate("0").valid).toBe(true);
    expect(luhn.validate("18").valid).toBe(true);
    expect(luhn.validate("4111111111111111").valid).toBe(
      true,
    );
  });

  test("invalid checksum", () => {
    const r = luhn.validate("19");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("empty rejected", () => {
    const r = luhn.validate("");
    expect(r.valid).toBe(false);
  });

  test("metadata", () => {
    expect(luhn.abbreviation).toBe("Luhn");
  });
});

// ─── Credit Card ────────────────────────────

describe("creditcard", () => {
  const valid = [
    "4111 1111 1111 1111", // Visa test
    "5500 0000 0000 0004", // Mastercard test
    "3400 0000 0000 009", // Amex test
    "6011 0000 0000 0004", // Discover test
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = creditcard.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("invalid Luhn", () => {
    const r = creditcard.validate("4111 1111 1111 1112");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("too short (12 digits)", () => {
    const r = creditcard.validate("411111111111");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("compact strips separators", () => {
    expect(creditcard.compact("4111-1111-1111-1111")).toBe(
      "4111111111111111",
    );
  });

  test("format Amex as 4-6-5", () => {
    expect(creditcard.format("340000000000009")).toBe(
      "3400 000000 00009",
    );
  });

  test("format Visa as 4-4-4-4", () => {
    expect(creditcard.format("4111111111111111")).toBe(
      "4111 1111 1111 1111",
    );
  });

  test("metadata", () => {
    expect(creditcard.abbreviation).toBe("CC");
  });
});

// ─── LEI ─────────────────────────────────────

describe("lei", () => {
  test("valid LEI", () => {
    // Bloomberg LP
    const r = lei.validate("5493006MHB84DD0ZWV18");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = lei.validate("5493 006M HB84 DD0Z WV18");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = lei.validate("5493006MHB84DD0ZWV19");
    expect(r.valid).toBe(false);
  });

  test("wrong length", () => {
    const r = lei.validate("5493006MHB84DD0Z");
    expect(r.valid).toBe(false);
  });

  test("metadata", () => {
    expect(lei.abbreviation).toBe("LEI");
    expect(lei.entityType).toBe("company");
  });
});
