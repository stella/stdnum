import { describe, expect, test } from "bun:test";

import {
  allPatterns,
  byCountry,
  byEntityType,
  toPatterns,
  toRegex,
} from "../src/patterns";
import { cz, de, fr, pl } from "../src";

describe("toRegex", () => {
  test("digit-only validator", () => {
    const re = toRegex(cz.ico);
    expect(re.test("25123891")).toBe(true);
    expect(re.test("2512389")).toBe(false);
    expect(re.test("251238910")).toBe(false);
  });

  test("prefixed validator", () => {
    const re = toRegex(de.vat);
    // DE VAT compact starts with digits only
    // (no prefix in compact form)
    expect(re.test("136695976")).toBe(true);
  });

  test("grouped format (compact)", () => {
    const re = toRegex(fr.siren);
    expect(re.test("732829320")).toBe(true);
  });

  test("grouped format (spaced)", () => {
    const re = toRegex(fr.siren);
    expect(re.test("732 829 320")).toBe(true);
  });

  test("returns global regex", () => {
    const re = toRegex(cz.ico);
    expect(re.flags).toContain("g");
  });

  test("finds candidates in text", () => {
    const re = toRegex(cz.ico);
    const text = "IČO 25123891 registered";
    const matches = [...text.matchAll(re)];
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]![0]).toBe("25123891");
  });
});

describe("toPatterns", () => {
  test("builds patterns for list", () => {
    const patterns = toPatterns([cz.ico, de.vat]);
    expect(patterns).toHaveLength(2);
    expect(patterns[0]!.validator).toBe(cz.ico);
    expect(patterns[0]!.regex).toBeInstanceOf(
      RegExp,
    );
  });
});

describe("byCountry", () => {
  test("filters by country", () => {
    const all = [
      cz.ico,
      cz.dic,
      cz.rc,
      de.vat,
      de.idnr,
    ];
    const czPatterns = byCountry("CZ", all);
    expect(czPatterns).toHaveLength(3);
    for (const p of czPatterns) {
      expect(p.validator.country).toBe("CZ");
    }
  });

  test("returns empty for unknown country", () => {
    expect(
      byCountry("CZ", [de.vat]),
    ).toHaveLength(0);
  });
});

describe("byEntityType", () => {
  test("filters by person", () => {
    const all = [cz.ico, cz.rc, pl.pesel, pl.nip];
    const persons = byEntityType("person", all);
    for (const p of persons) {
      expect(
        ["person", "any"].includes(
          p.validator.entityType,
        ),
      ).toBe(true);
    }
  });

  test("filters by company", () => {
    const all = [cz.ico, cz.rc, de.vat];
    const companies = byEntityType("company", all);
    expect(companies.length).toBeGreaterThan(0);
    for (const p of companies) {
      expect(
        ["company", "any"].includes(
          p.validator.entityType,
        ),
      ).toBe(true);
    }
  });
});

describe("allPatterns", () => {
  test("returns all", () => {
    const all = [cz.ico, de.vat, fr.siren];
    expect(allPatterns(all)).toHaveLength(3);
  });
});
