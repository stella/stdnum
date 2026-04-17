import { describe, expect, test } from "bun:test";

import { lk } from "../src";
import { parse } from "../src/lk/nic";

describe("lk.nic", () => {
  // ─── Valid (new format, 12 digits) ────────────

  const validNew = [
    "197819202757", // male, day 192
    "200015001238", // male, day 150
    "200051500120", // female, day 515 → 15
  ];

  for (const v of validNew) {
    test(`valid new: ${v}`, () => {
      const r = lk.nic.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  // ─── Valid (old format, 9 digits + V/X) ───────

  const validOld = [
    "862348753V",
    "781920274V",
    "906012341V",
  ];

  for (const v of validOld) {
    test(`valid old: ${v}`, () => {
      const r = lk.nic.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("accepts lowercase v/x", () => {
    const r = lk.nic.validate("862348753v");
    expect(r.valid).toBe(true);
  });

  test("accepts with spaces and dashes", () => {
    const r = lk.nic.validate("1978 1920 2757");
    expect(r.valid).toBe(true);
    const r2 = lk.nic.validate("8623-48753V");
    expect(r2.valid).toBe(true);
  });

  // ─── Invalid ─────────────────────────────────

  test("rejects wrong length", () => {
    const r = lk.nic.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("rejects non-digit new format", () => {
    const r = lk.nic.validate("19781920275A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("rejects invalid date (day 0)", () => {
    // day 000 is invalid
    const r = lk.nic.validate("199800002345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("rejects invalid date (day > 366 for male)", () => {
    const r = lk.nic.validate("199836700001");
    expect(r.valid).toBe(false);
  });

  test("rejects bad checksum (new)", () => {
    // change last digit
    const r = lk.nic.validate("197819202758");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("rejects bad checksum (old)", () => {
    const r = lk.nic.validate("862348754V");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  // ─── Format ───────────────────────────────────

  test("compact strips spaces and dashes", () => {
    expect(lk.nic.compact("1978 1920 2757")).toBe(
      "197819202757",
    );
    expect(lk.nic.compact("862-348753V")).toBe(
      "862348753V",
    );
  });

  test("format returns compact form", () => {
    expect(lk.nic.format("197819202757")).toBe(
      "197819202757",
    );
    expect(lk.nic.format("862348753v")).toBe("862348753V");
  });

  // ─── Metadata ─────────────────────────────────

  test("metadata", () => {
    expect(lk.nic.abbreviation).toBe("NIC");
    expect(lk.nic.country).toBe("LK");
    expect(lk.nic.entityType).toBe("person");
    expect(lk.nic.sourceUrl).toBeDefined();
  });
});

// ─── NIC parse() ────────────────────────────────

describe("lk.nic parse", () => {
  test("parse male born 1978, day 192 (Jul 11)", () => {
    const p = parse("197819202757");
    expect(p).not.toBeNull();
    if (p) {
      expect(p.gender).toBe("male");
      expect(p.birthDate.getFullYear()).toBe(1978);
      // day 192 of 1978 = July 11
      expect(p.birthDate.getMonth()).toBe(6);
      expect(p.birthDate.getDate()).toBe(11);
    }
  });

  test("parse female (old format)", () => {
    // 906012341V -> 1990, day 601 -> female, day 101
    const p = parse("906012341V");
    expect(p).not.toBeNull();
    if (p) {
      expect(p.gender).toBe("female");
      expect(p.birthDate.getFullYear()).toBe(1990);
      // day 101 of 1990 = April 11
      expect(p.birthDate.getMonth()).toBe(3);
      expect(p.birthDate.getDate()).toBe(11);
    }
  });

  test("parse female (new format)", () => {
    // 200051500120 -> 2000, day 515 -> female, day 15
    const p = parse("200051500120");
    expect(p).not.toBeNull();
    if (p) {
      expect(p.gender).toBe("female");
      expect(p.birthDate.getFullYear()).toBe(2000);
      // day 15 of 2000 = January 15
      expect(p.birthDate.getMonth()).toBe(0);
      expect(p.birthDate.getDate()).toBe(15);
    }
  });

  test("parse returns null for invalid", () => {
    expect(parse("197819202758")).toBeNull();
    expect(parse("invalid")).toBeNull();
    expect(parse("")).toBeNull();
  });
});
