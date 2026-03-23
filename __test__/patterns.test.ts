import { describe, expect, test } from "bun:test";

import { ch, cz, de, fr, pl } from "../src";
import {
  allPatterns,
  byCountry,
  byEntityType,
  toPatterns,
  toRegex,
} from "../src/patterns";

describe("toRegex", () => {
  test("digit-only validator", () => {
    expect(toRegex(cz.ico).test("25123891")).toBe(true);
    expect(toRegex(cz.ico).test("2512389")).toBe(false);
    expect(toRegex(cz.ico).test("251238910")).toBe(false);
  });

  test("format-prepended prefix (de.vat)", () => {
    // de.vat compact strips "DE", format re-adds it
    expect(toRegex(de.vat).test("DE136695976")).toBe(true);
    expect(toRegex(de.vat).test("DE 136695976")).toBe(true);
  });

  test("compact prefix (ch.uid)", () => {
    expect(toRegex(ch.uid).test("CHE-100.155.212")).toBe(
      true,
    );
    expect(toRegex(ch.uid).test("CHE100155212")).toBe(true);
  });

  test("format-prepended prefix (cz.dic)", () => {
    expect(toRegex(cz.dic).test("CZ25123891")).toBe(true);
  });

  test("multi-length validator (cz.rc)", () => {
    // cz.rc accepts both 9 and 10 digit values
    expect(toRegex(cz.rc).test("7103192745")).toBe(true);
    expect(toRegex(cz.rc).test("710319274")).toBe(true);
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

  test("finds prefixed identifier in text", () => {
    const re = toRegex(de.vat);
    const text = "VAT DE136695976 registered";
    const matches = [...text.matchAll(re)];
    expect(matches).toHaveLength(1);
    expect(matches[0]![0]).toBe("DE136695976");
  });
});

describe("toPatterns", () => {
  test("builds patterns for list", () => {
    const patterns = toPatterns([cz.ico, de.vat]);
    expect(patterns).toHaveLength(2);
    expect(patterns[0]!.validator).toBe(cz.ico);
    expect(patterns[0]!.regex).toBeInstanceOf(RegExp);
  });
});

describe("byCountry", () => {
  test("filters by country", () => {
    const all = [cz.ico, cz.dic, cz.rc, de.vat, de.idnr];
    const czPatterns = byCountry("CZ", all);
    expect(czPatterns).toHaveLength(3);
    for (const p of czPatterns) {
      expect(p.validator.country).toBe("CZ");
    }
  });

  test("returns empty for unknown country", () => {
    expect(byCountry("CZ", [de.vat])).toHaveLength(0);
  });
});

describe("byEntityType", () => {
  test("filters by person", () => {
    const all = [cz.ico, cz.rc, pl.pesel, pl.nip];
    const persons = byEntityType("person", all);
    for (const p of persons) {
      expect(
        ["person", "any"].includes(p.validator.entityType),
      ).toBe(true);
    }
  });

  test("any returns all validators", () => {
    const all = [cz.ico, cz.rc, pl.pesel, pl.nip];
    const result = byEntityType("any", all);
    expect(result).toHaveLength(all.length);
  });

  test("filters by company", () => {
    const all = [cz.ico, cz.rc, de.vat];
    const companies = byEntityType("company", all);
    expect(companies.length).toBeGreaterThan(0);
    for (const p of companies) {
      expect(
        ["company", "any"].includes(p.validator.entityType),
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
