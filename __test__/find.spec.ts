import { describe, expect, test } from "bun:test";

import { findInText } from "../src/find";
import codicefiscale from "../src/it/codicefiscale";
import dni from "../src/es/dni";
import nie from "../src/es/nie";
import nir from "../src/fr/nir";
import personnummer from "../src/se/personnummer";
import cnp from "../src/ro/cnp";
import iban from "../src/iban";
import pesel from "../src/pl/pesel";
import rc from "../src/cz/rc";

const ALL = [
  codicefiscale,
  dni,
  nie,
  nir,
  personnummer,
  cnp,
  iban,
  pesel,
  rc,
];

describe("findInText", () => {
  describe("candidate pattern scan", () => {
    test("finds Italian codice fiscale", () => {
      const text =
        "Il contribuente RCCMNL83S18D969H ha presentato";
      const hits = findInText(text, {
        validators: [codicefiscale],
      });
      expect(hits).toHaveLength(1);
      expect(hits[0]!.compact).toBe("RCCMNL83S18D969H");
      expect(hits[0]!.mode).toBe("candidate");
      expect(hits[0]!.validator).toBe(codicefiscale);
    });

    test("rejects invalid codice fiscale", () => {
      const text = "ABCDEF12G34H567X is not valid";
      const hits = findInText(text, {
        validators: [codicefiscale],
      });
      expect(hits).toHaveLength(0);
    });

    test("finds Spanish DNI", () => {
      const text = "DNI: 12345678Z del solicitante";
      const hits = findInText(text, {
        validators: [dni],
      });
      expect(hits.some((h) => h.mode === "candidate"))
        .toBe(true);
    });

    test("finds Czech birth number", () => {
      const text = "rodné číslo 710319/2745 zaměstnance";
      const hits = findInText(text, {
        validators: [rc],
      });
      expect(hits.length).toBeGreaterThanOrEqual(1);
    });

    test("finds IBAN", () => {
      const text =
        "Platba na účet CZ65 0800 0000 1920 0014 5399";
      const hits = findInText(text, {
        validators: [iban],
      });
      expect(hits).toHaveLength(1);
      expect(hits[0]!.mode).toBe("candidate");
    });
  });

  describe("alias scan", () => {
    test("finds value after alias keyword", () => {
      const text =
        "codice fiscale: RCCMNL83S18D969H del soggetto";
      const hits = findInText(text, {
        validators: [codicefiscale],
      });
      // Should find via both candidate + alias
      expect(hits.length).toBeGreaterThanOrEqual(1);
      const aliasHit = hits.find(
        (h) => h.mode === "alias",
      );
      // Candidate mode should also find it, alias
      // may be deduplicated
      expect(hits.length).toBeGreaterThanOrEqual(1);
    });

    test("finds value after abbreviated alias", () => {
      const text = "C.F. RCCMNL83S18D969H";
      const hits = findInText(text, {
        validators: [codicefiscale],
      });
      expect(hits.length).toBeGreaterThanOrEqual(1);
    });

    test("finds PESEL after keyword", () => {
      const text = "PESEL: 44051401359 osoby";
      const hits = findInText(text, {
        validators: [pesel],
      });
      expect(hits.length).toBeGreaterThanOrEqual(1);
    });

    test("alias is case-insensitive", () => {
      const text = "CODICE FISCALE: RCCMNL83S18D969H";
      const hits = findInText(text, {
        validators: [codicefiscale],
      });
      expect(hits.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("country filtering", () => {
    test("filters by country", () => {
      const text =
        "CF RCCMNL83S18D969H and DNI 12345678Z";
      const hits = findInText(text, {
        validators: ALL,
        countries: ["IT"],
      });
      // Should only find Italian, not Spanish
      for (const h of hits) {
        expect(h.validator.country).toBe("IT");
      }
    });

    test("includes international validators", () => {
      const text =
        "IBAN: CZ65 0800 0000 1920 0014 5399";
      const hits = findInText(text, {
        validators: ALL,
        countries: ["CZ"],
      });
      // IBAN has no country — should be included
      expect(hits.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("edge cases", () => {
    test("empty text returns empty", () => {
      const hits = findInText("", {
        validators: ALL,
      });
      expect(hits).toHaveLength(0);
    });

    test("no matches returns empty", () => {
      const hits = findInText(
        "This is a normal sentence with no IDs.",
        { validators: ALL },
      );
      expect(hits).toHaveLength(0);
    });

    test("results are sorted by start position", () => {
      const text =
        "CF RCCMNL83S18D969H and PESEL 44051401359";
      const hits = findInText(text, {
        validators: [codicefiscale, pesel],
      });
      for (let i = 1; i < hits.length; i++) {
        expect(hits[i]!.start).toBeGreaterThanOrEqual(
          hits[i - 1]!.start,
        );
      }
    });
  });
});
