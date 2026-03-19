import { describe, expect, test } from "bun:test";
import fc from "fast-check";

import {
  at,
  be,
  bg,
  ch,
  creditcard,
  cy,
  cz,
  de,
  dk,
  ee,
  es,
  fi,
  fr,
  gb,
  gr,
  hr,
  hu,
  iban,
  ie,
  is_ as is,
  it,
  lei,
  lt,
  lu,
  luhn,
  lv,
  mt,
  nl,
  no,
  pl,
  pt,
  ro,
  se,
  si,
  sk,
} from "../src";
import type { Validator } from "../src/types";

// ─── Helpers ──────────────────────────────────

/** Random digit string of fixed length. */
const digs = (len: number) =>
  fc
    .array(fc.integer({ min: 0, max: 9 }), {
      minLength: len,
      maxLength: len,
    })
    .map((ds) => ds.join(""));

/**
 * Random alphanumeric uppercase string of fixed
 * length.
 */
const alnum = (len: number) =>
  fc
    .array(
      fc.oneof(
        fc.integer({ min: 0, max: 9 }).map(String),
        fc
          .integer({ min: 65, max: 90 })
          .map((c) => String.fromCharCode(c)),
      ),
      { minLength: len, maxLength: len },
    )
    .map((cs) => cs.join(""));

// ─── Validator registry ───────────────────────

const ALL_VALIDATORS: Array<[string, Validator]> = [
  // AT
  ["at.uid", at.uid],
  // BE
  ["be.vat", be.vat],
  ["be.nn", be.nn],
  // BG
  ["bg.egn", bg.egn],
  ["bg.vat", bg.vat],
  // CH
  ["ch.uid", ch.uid],
  ["ch.vat", ch.vat],
  ["ch.ssn", ch.ssn],
  // CY
  ["cy.vat", cy.vat],
  // CZ
  ["cz.ico", cz.ico],
  ["cz.dic", cz.dic],
  ["cz.rc", cz.rc],
  // DE
  ["de.vat", de.vat],
  ["de.idnr", de.idnr],
  // DK
  ["dk.cpr", dk.cpr],
  ["dk.vat", dk.vat],
  // EE
  ["ee.ik", ee.ik],
  ["ee.vat", ee.vat],
  // ES
  ["es.dni", es.dni],
  ["es.nie", es.nie],
  ["es.vat", es.vat],
  // FI
  ["fi.hetu", fi.hetu],
  ["fi.vat", fi.vat],
  // FR
  ["fr.siren", fr.siren],
  ["fr.siret", fr.siret],
  ["fr.nif", fr.nif],
  ["fr.tva", fr.tva],
  // GB
  ["gb.utr", gb.utr],
  ["gb.vat", gb.vat],
  // GR
  ["gr.amka", gr.amka],
  ["gr.vat", gr.vat],
  // HR
  ["hr.vat", hr.vat],
  // HU
  ["hu.vat", hu.vat],
  // IE
  ["ie.pps", ie.pps],
  ["ie.vat", ie.vat],
  // IS
  ["is.kennitala", is.kennitala],
  ["is.vsk", is.vsk],
  // IT
  ["it.codiceFiscale", it.codiceFiscale],
  ["it.iva", it.iva],
  // LT
  ["lt.asmens", lt.asmens],
  ["lt.vat", lt.vat],
  // LU
  ["lu.vat", lu.vat],
  // LV
  ["lv.vat", lv.vat],
  // MT
  ["mt.vat", mt.vat],
  // NL
  ["nl.bsn", nl.bsn],
  ["nl.vat", nl.vat],
  // NO
  ["no.orgnr", no.orgnr],
  ["no.mva", no.mva],
  ["no.fodselsnummer", no.fodselsnummer],
  // PL
  ["pl.nip", pl.nip],
  ["pl.pesel", pl.pesel],
  ["pl.regon", pl.regon],
  // PT
  ["pt.vat", pt.vat],
  // RO
  ["ro.cnp", ro.cnp],
  ["ro.vat", ro.vat],
  // SE
  ["se.personnummer", se.personnummer],
  ["se.vat", se.vat],
  // SI
  ["si.emso", si.emso],
  ["si.vat", si.vat],
  // SK
  ["sk.ico", sk.ico],
  ["sk.dic", sk.dic],
  ["sk.rc", sk.rc],
  // International
  ["luhn", luhn],
  ["creditcard", creditcard],
  ["iban", iban],
  ["lei", lei],
];

/**
 * Build an arbitrary that produces strings with a
 * reasonable chance of passing validation. For most
 * validators pure digit strings of the right length
 * suffice; special-format validators get tailored
 * arbitraries.
 */
const arbitraryFor = (
  name: string,
): fc.Arbitrary<string> => {
  switch (name) {
    // IBAN: 2-letter country + 2 check digits + BBAN
    case "iban":
      return fc
        .oneof(
          // Generate plausible IBANs for a few countries
          digs(16).map((d) => `AT${d}`),
          digs(18).map((d) => `DE${d}`),
          digs(20).map((d) => `CZ${d}`),
          digs(20).map((d) => `SK${d}`),
          digs(12).map((d) => `BE${d}`),
          digs(14).map((d) => `DK${d}`),
        )
        .map((s) => s.toUpperCase());

    // LEI: 18 alphanumeric + 2 check digits
    case "lei":
      return fc
        .tuple(alnum(4), alnum(14), digs(2))
        .map(([a, b, c]) => a + b + c);

    // FI HETU: DDMMYY + separator + 3 digits + check
    case "fi.hetu":
      return (
        fc
          .tuple(
            fc.integer({ min: 1, max: 28 }),
            fc.integer({ min: 1, max: 12 }),
            fc.integer({ min: 0, max: 99 }),
            fc.constantFrom(
              "-",
              "Y",
              "X",
              "W",
              "V",
              "U",
              "A",
              "B",
              "C",
              "D",
              "E",
              "F",
              "+",
            ),
            digs(3),
          )
          .map(([dd, mm, yy, sep, serial]) => {
            const d = String(dd).padStart(2, "0");
            const m = String(mm).padStart(2, "0");
            const y = String(yy).padStart(2, "0");
            return `${d}${m}${y}${sep}${serial}`;
          })
          // Append a dummy check char; validation will
          // filter invalid ones
          .chain((base) =>
            fc
              .constantFrom(
                ..."0123456789ABCDEFHJKLMNPRSTUVWXY",
              )
              .map((c) => base + c),
          )
      );

    // IE PPS: 7 digits + letter + optional letter
    case "ie.pps":
      return fc
        .tuple(
          digs(7),
          fc
            .constantFrom(..."WABCDEFGHIJKLMNOPQRSTUV")
            .map(String),
          fc.oneof(
            fc.constant(""),
            fc
              .constantFrom(..."WABCDEFGHIJKLMNOPQRSTUV")
              .map(String),
          ),
        )
        .map(([d, c, s]) => d + c + s);

    // IE VAT: 7 digits + 1-2 letters
    case "ie.vat":
      return fc
        .tuple(
          digs(7),
          fc
            .constantFrom(..."ABCDEFGHIJKLMNOPQRSTUV")
            .map(String),
          fc.oneof(
            fc.constant(""),
            fc
              .constantFrom(..."WABCDEFGHIJKLMNOPQRSTUV")
              .map(String),
          ),
        )
        .map(([d, c, s]) => d + c + s);

    // ES DNI: 8 digits + letter
    case "es.dni":
      return fc
        .tuple(
          digs(8),
          fc
            .constantFrom(..."TRWAGMYFPDXBNJZSQVHLCKE")
            .map(String),
        )
        .map(([d, l]) => d + l);

    // ES NIE: X/Y/Z + 7 digits + letter
    case "es.nie":
      return fc
        .tuple(
          fc.constantFrom("X", "Y", "Z"),
          digs(7),
          fc
            .constantFrom(..."TRWAGMYFPDXBNJZSQVHLCKE")
            .map(String),
        )
        .map(([p, d, l]) => p + d + l);

    // ES VAT: DNI, NIE, or CIF-like
    case "es.vat":
      return fc.oneof(
        // DNI form
        fc
          .tuple(
            digs(8),
            fc
              .constantFrom(..."TRWAGMYFPDXBNJZSQVHLCKE")
              .map(String),
          )
          .map(([d, l]) => d + l),
        // NIE form
        fc
          .tuple(
            fc.constantFrom("X", "Y", "Z"),
            digs(7),
            fc
              .constantFrom(..."TRWAGMYFPDXBNJZSQVHLCKE")
              .map(String),
          )
          .map(([p, d, l]) => p + d + l),
        // CIF form
        fc
          .tuple(
            fc.constantFrom(..."ABCDEFGHJNPQRSUVW"),
            digs(7),
            fc
              .constantFrom(..."0123456789JABCDEFGHI")
              .map(String),
          )
          .map(([p, d, c]) => p + d + c),
      );

    // IS kennitala: DDMMYY + 2 digits + check + century
    case "is.kennitala":
      return fc
        .tuple(
          fc.integer({ min: 1, max: 28 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 0, max: 99 }),
          digs(2),
          fc.integer({ min: 0, max: 9 }),
          fc.constantFrom(0, 9),
        )
        .map(([dd, mm, yy, rand, check, century]) => {
          const d = String(dd).padStart(2, "0");
          const m = String(mm).padStart(2, "0");
          const y = String(yy).padStart(2, "0");
          return `${d}${m}${y}${rand}${check}${century}`;
        });

    // IS VSK: 5 or 6 digits
    case "is.vsk":
      return fc.oneof(digs(5), digs(6));

    // IT codice fiscale: complex alphanumeric format
    case "it.codiceFiscale":
      return fc
        .tuple(
          // 6 consonant-like letters for name parts
          fc
            .array(
              fc
                .constantFrom(
                  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
                )
                .map(String),
              { minLength: 6, maxLength: 6 },
            )
            .map((a) => a.join("")),
          digs(2),
          fc.constantFrom(..."ABCDEHLMPRST").map(String),
          digs(2),
          fc
            .constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ")
            .map(String),
          digs(3),
          fc
            .constantFrom(..."ABCDEFGHIJKLMNOPQRSTUVWXYZ")
            .map(String),
        )
        .map(
          ([n, yy, month, dd, muni, code, chk]) =>
            n + yy + month + dd + muni + code + chk,
        );

    // NL VAT: 9 digits + B + 2 digits
    case "nl.vat":
      return fc
        .tuple(digs(9), digs(2))
        .map(([a, b]) => `${a}B${b}`);

    // FR TVA: 2 alphanumeric + 9 digits
    case "fr.tva":
      return fc
        .tuple(alnum(2), digs(9))
        .map(([a, b]) => a + b);

    // SE personnummer: YYYYMMDD + 4 digits
    case "se.personnummer":
      return fc
        .tuple(
          fc.integer({ min: 1900, max: 2020 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          digs(4),
        )
        .map(([y, m, d, s]) => {
          const ys = String(y);
          const ms = String(m).padStart(2, "0");
          const ds = String(d).padStart(2, "0");
          return `${ys}${ms}${ds}${s}`;
        });

    // DK CPR: DDMMYY + 4 digits
    case "dk.cpr":
      return fc
        .tuple(
          fc.integer({ min: 1, max: 28 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 0, max: 99 }),
          digs(4),
        )
        .map(([dd, mm, yy, s]) => {
          const d = String(dd).padStart(2, "0");
          const m = String(mm).padStart(2, "0");
          const y = String(yy).padStart(2, "0");
          return `${d}${m}${y}${s}`;
        });

    // GR AMKA: 11 digits (DDMMYY + 5)
    case "gr.amka":
      return fc
        .tuple(
          fc.integer({ min: 1, max: 28 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 0, max: 99 }),
          digs(5),
        )
        .map(([dd, mm, yy, s]) => {
          const d = String(dd).padStart(2, "0");
          const m = String(mm).padStart(2, "0");
          const y = String(yy).padStart(2, "0");
          return `${d}${m}${y}${s}`;
        });

    // NO fodselsnummer: DDMMYY + 5 digits
    case "no.fodselsnummer":
      return fc
        .tuple(
          fc.integer({ min: 1, max: 28 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 0, max: 99 }),
          digs(5),
        )
        .map(([dd, mm, yy, s]) => {
          const d = String(dd).padStart(2, "0");
          const m = String(mm).padStart(2, "0");
          const y = String(yy).padStart(2, "0");
          return `${d}${m}${y}${s}`;
        });

    // Credit card: 13-19 digits
    case "creditcard":
      return fc
        .integer({ min: 13, max: 19 })
        .chain((len) => digs(len));

    // Luhn: 1-20 digits
    case "luhn":
      return fc
        .integer({ min: 1, max: 20 })
        .chain((len) => digs(len));

    // RO CNP: 13 digits starting with 1-8
    case "ro.cnp":
      return fc
        .tuple(fc.integer({ min: 1, max: 8 }), digs(12))
        .map(([s, d]) => `${s}${d}`);

    // RO VAT: 2-10 digits
    case "ro.vat":
      return fc
        .integer({ min: 2, max: 10 })
        .chain((len) => digs(len));

    // BG EGN: 10 digits (YYMMDD + 4)
    case "bg.egn":
      return fc
        .tuple(
          fc.integer({ min: 0, max: 99 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          digs(4),
        )
        .map(([yy, mm, dd, s]) => {
          const y = String(yy).padStart(2, "0");
          const m = String(mm).padStart(2, "0");
          const d = String(dd).padStart(2, "0");
          return `${y}${m}${d}${s}`;
        });

    // EE IK: 11 digits (gender + YYMMDD + 4)
    case "ee.ik":
      return fc
        .tuple(
          fc.integer({ min: 1, max: 6 }),
          fc.integer({ min: 0, max: 99 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          digs(4),
        )
        .map(([g, yy, mm, dd, s]) => {
          const y = String(yy).padStart(2, "0");
          const m = String(mm).padStart(2, "0");
          const d = String(dd).padStart(2, "0");
          return `${g}${y}${m}${d}${s}`;
        });

    // LT asmens: 11 digits (gender + YYMMDD + 4)
    case "lt.asmens":
      return fc
        .tuple(
          fc.integer({ min: 1, max: 6 }),
          fc.integer({ min: 0, max: 99 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          digs(4),
        )
        .map(([g, yy, mm, dd, s]) => {
          const y = String(yy).padStart(2, "0");
          const m = String(mm).padStart(2, "0");
          const d = String(dd).padStart(2, "0");
          return `${g}${y}${m}${d}${s}`;
        });

    // SI EMSO: 13 digits (DDMMYYY + region + seq + check)
    case "si.emso":
      return digs(13);

    // PL PESEL: 11 digits (YYMMDD + 5)
    case "pl.pesel":
      return fc
        .tuple(
          fc.integer({ min: 0, max: 99 }),
          fc.integer({ min: 1, max: 12 }),
          fc.integer({ min: 1, max: 28 }),
          digs(5),
        )
        .map(([yy, mm, dd, s]) => {
          const y = String(yy).padStart(2, "0");
          const m = String(mm).padStart(2, "0");
          const d = String(dd).padStart(2, "0");
          return `${y}${m}${d}${s}`;
        });

    // PL REGON: 9 or 14 digits
    case "pl.regon":
      return fc.oneof(digs(9), digs(14));

    // Default: digit strings of various lengths
    default:
      return fc
        .integer({ min: 5, max: 16 })
        .chain((len) => digs(len));
  }
};

// ─── Property tests ──────────────────────────

describe("property: roundtrip", () => {
  for (const [name, v] of ALL_VALIDATORS) {
    test(name, () => {
      const arb = arbitraryFor(name);
      let found = 0;

      fc.assert(
        fc.property(arb, (input) => {
          const r = v.validate(input);
          if (!r.valid) return true; // skip invalid

          found++;
          const compacted = r.compact;
          const formatted = v.format(compacted);
          const recompacted = v.compact(formatted);
          expect(recompacted).toBe(compacted);
          return true;
        }),
        { numRuns: 500 },
      );

      // Not a failure if none found; some validators
      // are extremely selective
      if (found === 0) {
        console.log(
          `  [skip] ${name}: no valid inputs found`,
        );
      }
    });
  }
});

describe("property: idempotency", () => {
  for (const [name, v] of ALL_VALIDATORS) {
    test(name, () => {
      const arb = arbitraryFor(name);
      let found = 0;

      fc.assert(
        fc.property(arb, (input) => {
          const r = v.validate(input);
          if (!r.valid) return true; // skip invalid

          found++;
          const compacted = r.compact;
          const r2 = v.validate(compacted);
          expect(r2.valid).toBe(true);
          if (r2.valid) {
            expect(r2.compact).toBe(compacted);
          }
          return true;
        }),
        { numRuns: 500 },
      );

      if (found === 0) {
        console.log(
          `  [skip] ${name}: no valid inputs found`,
        );
      }
    });
  }
});
