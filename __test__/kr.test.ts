import { describe, expect, test } from "bun:test";

import { kr } from "../src";
import { parse } from "../src/kr/rrn";

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

  test("rejects tax office < 101", () => {
    const r = kr.brn.validate("1001234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("rejects business type 00", () => {
    const r = kr.brn.validate("1010012345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("rejects serial 0000", () => {
    const r = kr.brn.validate("1010100005");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
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

// ─── RRN ────────────────────────────────────────

describe("kr.rrn", () => {
  const valid = [
    "9710139019902",
    "9501011000109",
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = kr.rrn.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid with dash separator", () => {
    const r = kr.rrn.validate("971013-9019902");
    expect(r.valid).toBe(true);
  });

  const invalid = [
    "971013901990", // too short (12)
    "97101390199020", // too long (14)
    "971013901990A", // non-digit
    "9710139019903", // bad checksum
  ];

  for (const v of invalid) {
    test(`invalid: ${v}`, () => {
      const r = kr.rrn.validate(v);
      expect(r.valid).toBe(false);
    });
  }

  test("rejects invalid date", () => {
    // month 13 is invalid
    const r = kr.rrn.validate("9713139019902");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("rejects place > 96", () => {
    // place of birth 97 is invalid; the place
    // check runs before the checksum check
    const r = kr.rrn.validate("9710131971234");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("checksum error code", () => {
    const r = kr.rrn.validate("9710139019903");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("compact strips dashes and slashes", () => {
    expect(kr.rrn.compact("971013-9019902")).toBe(
      "9710139019902",
    );
    expect(kr.rrn.compact("971013/9019902")).toBe(
      "9710139019902",
    );
  });

  test("format adds dash", () => {
    expect(kr.rrn.format("9710139019902")).toBe(
      "971013-9019902",
    );
  });

  test("metadata", () => {
    expect(kr.rrn.abbreviation).toBe("RRN");
    expect(kr.rrn.country).toBe("KR");
    expect(kr.rrn.entityType).toBe("person");
  });
});

// ─── RRN parse() ────────────────────────────────

describe("kr.rrn parse", () => {
  test("parse male born 1997-10-13", () => {
    // gender digit 9 = pre-1800 male by convention
    // Actually digit 9 maps to 1800s. Let's use
    // a 1900s example instead.
    const p = parse("9501011000109");
    expect(p).not.toBeNull();
    if (p) {
      expect(p.gender).toBe("male");
      expect(p.birthDate.getFullYear()).toBe(1995);
      expect(p.birthDate.getMonth()).toBe(0);
      expect(p.birthDate.getDate()).toBe(1);
    }
  });

  test("parse with dash separator", () => {
    const p = parse("971013-9019902");
    expect(p).not.toBeNull();
    if (p) {
      // digit 9 = 1800s, male
      expect(p.gender).toBe("male");
      expect(p.birthDate.getFullYear()).toBe(1897);
      expect(p.birthDate.getMonth()).toBe(9);
      expect(p.birthDate.getDate()).toBe(13);
    }
  });

  test("parse 2000s male foreigner (digit 7)", () => {
    // gender digit 7 = male foreigner born 2000s
    const p = parse("0503157010100");
    expect(p).not.toBeNull();
    if (p) {
      expect(p.gender).toBe("male");
      expect(p.birthDate.getFullYear()).toBe(2005);
      expect(p.birthDate.getMonth()).toBe(2);
      expect(p.birthDate.getDate()).toBe(15);
    }
  });

  test("parse returns null for invalid", () => {
    expect(parse("9710139019903")).toBeNull();
    expect(parse("invalid")).toBeNull();
    expect(parse("")).toBeNull();
  });
});
