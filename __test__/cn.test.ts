import { describe, expect, test } from "bun:test";

import { cn } from "../src";

// ─── RIC (Resident Identity Card) ────────────

describe("cn.ric", () => {
  const valid18 = [
    "11010519491231002X",
    "440524188001010014",
  ];

  for (const v of valid18) {
    test(`valid 18-char: ${v}`, () => {
      const r = cn.ric.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid with lowercase x", () => {
    const r = cn.ric.validate("11010519491231002x");
    expect(r.valid).toBe(true);
  });

  test("valid 15-digit legacy format", () => {
    // 15-digit: area(6) + YYMMDD(6) + seq(3)
    const r = cn.ric.validate("110105491231002");
    expect(r.valid).toBe(true);
  });

  const invalid = [
    "11010519491231002Y", // bad check char
    "110105194912310020", // bad checksum
    "1101051949123100", // wrong length (16)
    "11010519491331002X", // invalid month (13)
    "11010519490231002X", // invalid date (Feb 31)
    "1101051949ABCD002X", // non-digits in body
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = cn.ric.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("checksum error code", () => {
    const r = cn.ric.validate("110105194912310020");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid date error code", () => {
    const r = cn.ric.validate("11010519491331002X");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("compact strips spaces", () => {
    expect(cn.ric.compact("110105 19491231 002X")).toBe(
      "11010519491231002X",
    );
  });

  test("metadata", () => {
    expect(cn.ric.abbreviation).toBe("RIC");
    expect(cn.ric.country).toBe("CN");
    expect(cn.ric.entityType).toBe("person");
  });
});

// ─── USCC (Unified Social Credit Code) ─────

describe("cn.uscc", () => {
  const valid = [
    "91110000600037341L",
    "911522010783762860",
    "91152201078377449P",
    "91310115MA1K3BTP2B",
    "91340600MA2PBM9HXD",
    "121200004013590816",
    "Y1110000600037341Y", // non-digit authority code
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = cn.uscc.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid with spaces", () => {
    const r = cn.uscc.validate("91 110000 600037341L");
    expect(r.valid).toBe(true);
  });

  test("valid lowercase normalised", () => {
    const r = cn.uscc.validate("91110000600037341l");
    expect(r.valid).toBe(true);
  });

  test("wrong length", () => {
    const r = cn.uscc.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid character (excluded letter I)", () => {
    const r = cn.uscc.validate("I1110000600037341L");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("non-digit region code rejected", () => {
    const r = cn.uscc.validate("91A10000600037341L");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid alphabet chars (I, O, Z, S, V)", () => {
    const r = cn.uscc.validate("9111000060003IOZSV");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("bad check digit", () => {
    const r = cn.uscc.validate("91110000600037341N");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("compact strips spaces and dashes", () => {
    expect(cn.uscc.compact("91 110000-600037341L")).toBe(
      "91110000600037341L",
    );
  });

  test("metadata", () => {
    expect(cn.uscc.abbreviation).toBe("USCC");
    expect(cn.uscc.country).toBe("CN");
    expect(cn.uscc.entityType).toBe("company");
  });
});
