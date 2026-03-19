import { describe, expect, test } from "bun:test";

import {
  bic,
  creditcard,
  iban,
  isin,
  lei,
  luhn,
} from "../src";
import { detectNetwork } from "../src/creditcard";

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

// ─── BIC ─────────────────────────────────────

describe("bic", () => {
  const valid = [
    "DEUTDEFF",
    "COBADEFFXXX",
    "BNPAFRPP",
    "GEBABEBB",
    "BOFAUS3N",
    "CHASUS33XXX",
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = bic.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid with spaces", () => {
    const r = bic.validate("DEUT DE FF");
    expect(r.valid).toBe(true);
  });

  test("valid lowercase normalised", () => {
    const r = bic.validate("deutdeff");
    expect(r.valid).toBe(true);
  });

  test("invalid length (9 chars)", () => {
    const r = bic.validate("AGRIFRPP8");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid format (digits in institution)", () => {
    const r = bic.validate("12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("any ISO 3166-1 alpha-2 country accepted", () => {
    // SWIFT accepts all country codes
    const r = bic.validate("DEUTXXFF");
    expect(r.valid).toBe(true);
  });

  test("compact strips separators", () => {
    expect(bic.compact("DEUT DE FF XXX")).toBe(
      "DEUTDEFFXXX",
    );
  });

  test("format 8-char BIC", () => {
    expect(bic.format("DEUTDEFF")).toBe("DEUT DE FF");
  });

  test("format 11-char BIC", () => {
    expect(bic.format("COBADEFFXXX")).toBe(
      "COBA DE FF XXX",
    );
  });

  test("metadata", () => {
    expect(bic.abbreviation).toBe("BIC");
    expect(bic.entityType).toBe("company");
    expect(bic.country).toBeUndefined();
  });
});

// ─── ISIN ────────────────────────────────────

describe("isin", () => {
  const valid = [
    "US0378331005", // Apple
    "DE000BAY0017", // Bayer
    "GB0002634946", // BAE Systems
    "JP3435000009", // Sony
    "FR0000120271", // TotalEnergies
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = isin.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid with spaces", () => {
    const r = isin.validate("US 0378 3310 05");
    expect(r.valid).toBe(true);
  });

  test("valid lowercase normalised", () => {
    const r = isin.validate("us0378331005");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = isin.validate("US0378331003");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = isin.validate("US037833100");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid format (no country prefix)", () => {
    const r = isin.validate("000378331005");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("compact strips separators", () => {
    expect(isin.compact("US 0378-3310-05")).toBe(
      "US0378331005",
    );
  });

  test("format groups correctly", () => {
    expect(isin.format("US0378331005")).toBe(
      "US 0378 3310 05",
    );
  });

  test("metadata", () => {
    expect(isin.abbreviation).toBe("ISIN");
    expect(isin.entityType).toBe("any");
    expect(isin.country).toBeUndefined();
  });
});

// ─── detectNetwork ──────────────────────────

describe("detectNetwork", () => {
  test("Visa: starts with 4", () => {
    expect(detectNetwork("4111111111111111")).toBe("visa");
  });

  test("Visa: formatted input", () => {
    expect(detectNetwork("4111 1111 1111 1111")).toBe(
      "visa",
    );
  });

  test("Mastercard: 51-55 range", () => {
    expect(detectNetwork("5100000000000000")).toBe(
      "mastercard",
    );
    expect(detectNetwork("5500000000000004")).toBe(
      "mastercard",
    );
  });

  test("Mastercard: 2221-2720 range", () => {
    expect(detectNetwork("2221000000000000")).toBe(
      "mastercard",
    );
    expect(detectNetwork("2720000000000000")).toBe(
      "mastercard",
    );
  });

  test("Mastercard: 2220 is not Mastercard", () => {
    expect(detectNetwork("2220000000000000")).not.toBe(
      "mastercard",
    );
  });

  test("Amex: 34", () => {
    expect(detectNetwork("340000000000009")).toBe("amex");
  });

  test("Amex: 37", () => {
    expect(detectNetwork("370000000000000")).toBe("amex");
  });

  test("Discover: 6011", () => {
    expect(detectNetwork("6011000000000004")).toBe(
      "discover",
    );
  });

  test("Discover: 65", () => {
    expect(detectNetwork("6500000000000000")).toBe(
      "discover",
    );
  });

  test("Discover: 644-649", () => {
    expect(detectNetwork("6440000000000000")).toBe(
      "discover",
    );
    expect(detectNetwork("6490000000000000")).toBe(
      "discover",
    );
  });

  test("Discover: 622126-622925", () => {
    expect(detectNetwork("6221260000000000")).toBe(
      "discover",
    );
    expect(detectNetwork("6229250000000000")).toBe(
      "discover",
    );
  });

  test("Diners Club: 300-305", () => {
    expect(detectNetwork("30000000000000")).toBe("diners");
    expect(detectNetwork("30500000000000")).toBe("diners");
  });

  test("Diners Club: 36", () => {
    expect(detectNetwork("36000000000000")).toBe("diners");
  });

  test("Diners Club: 38", () => {
    expect(detectNetwork("38000000000000")).toBe("diners");
  });

  test("JCB: 3528-3589", () => {
    expect(detectNetwork("3528000000000000")).toBe("jcb");
    expect(detectNetwork("3589000000000000")).toBe("jcb");
  });

  test("JCB: 3527 is not JCB", () => {
    expect(detectNetwork("3527000000000000")).not.toBe(
      "jcb",
    );
  });

  test("UnionPay: 62 (non-Discover)", () => {
    expect(detectNetwork("6200000000000000")).toBe(
      "unionpay",
    );
  });

  test("Maestro prefixes", () => {
    expect(detectNetwork("5018000000000000")).toBe(
      "maestro",
    );
    expect(detectNetwork("5020000000000000")).toBe(
      "maestro",
    );
    expect(detectNetwork("5038000000000000")).toBe(
      "maestro",
    );
    expect(detectNetwork("5893000000000000")).toBe(
      "maestro",
    );
    expect(detectNetwork("6304000000000000")).toBe(
      "maestro",
    );
    expect(detectNetwork("6759000000000000")).toBe(
      "maestro",
    );
    expect(detectNetwork("6761000000000000")).toBe(
      "maestro",
    );
    expect(detectNetwork("6762000000000000")).toBe(
      "maestro",
    );
    expect(detectNetwork("6763000000000000")).toBe(
      "maestro",
    );
  });

  test("null for unrecognized prefix", () => {
    expect(detectNetwork("9999999999999999")).toBeNull();
  });

  test("null for empty string", () => {
    expect(detectNetwork("")).toBeNull();
  });

  test("handles dashes and dots", () => {
    expect(
      detectNetwork("4111-1111-1111-1111"),
    ).toBe("visa");
    expect(
      detectNetwork("4111.1111.1111.1111"),
    ).toBe("visa");
  });
});
