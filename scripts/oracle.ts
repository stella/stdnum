/**
 * Oracle tests: cross-check @stll/stdnum against
 * independent implementations.
 *
 * JS oracles (always run):
 *   - validate-polish: PL NIP, PESEL, REGON
 *   - ibantools: IBAN (with BBAN format)
 *
 * Python oracle (optional, run if .venv exists):
 *   - python-stdnum: all formats
 *   Setup: python3 -m venv .venv
 *          .venv/bin/pip install python-stdnum
 *
 * Run: bun run oracle
 */

import fc from "fast-check";
import fastLuhn from "fast-luhn";
import IBAN from "iban";
import { isValidIBAN } from "ibantools";
import {
  checkVAT,
  belgium,
  bulgaria,
  croatia,
  cyprus,
  czechRepublic,
  denmark,
  estonia,
  finland,
  germany,
  greece,
  hungary,
  ireland,
  italy,
  latvia,
  lithuania,
  luxembourg,
  malta,
  netherlands,
  poland,
  portugal,
  romania,
  slovenia,
  spain,
  sweden,
} from "jsvat";
import luhnLib from "luhn";
import { execSync } from "node:child_process";
import { validatePerson as stdnumValidatePerson } from "stdnum";
import { validatePolish } from "validate-polish";

import {
  at,
  be,
  bg,
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
  ie,
  it,
  lt,
  lu,
  lv,
  mt,
  nl,
  pl,
  pt,
  ro,
  se,
  si,
  sk,
} from "../src";
import ibanValidator from "../src/iban";
import luhnValidator from "../src/luhn";

// ─── Subprocess bridges ──────────────────────

const PYTHON = ".venv/bin/python3";
const RUST_ORACLE =
  "scripts/rust-oracle/target/release/stdnum-oracle";
const RUBY_GEM_DIR = (() => {
  try {
    return execSync("ruby -e 'puts Gem.user_dir'", {
      encoding: "utf-8",
    }).trim();
  } catch {
    return "";
  }
})();

const hasPython = (): boolean => {
  try {
    execSync(`${PYTHON} -c "import stdnum"`, {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Batch-validate values with python-stdnum.
 * Writes a temp Python script to avoid shell
 * escaping issues with -c.
 */
const pyBatch = (
  module: string,
  values: readonly string[],
): boolean[] => {
  const json = JSON.stringify(values);
  const script = `
import json, sys
from stdnum.${module} import is_valid
vals = json.loads(sys.stdin.read())
for v in vals:
    print("1" if is_valid(v) else "0")
`.trim();
  const { writeFileSync } = require("node:fs");
  const tmpScript = "/tmp/_stdnum_oracle.py";
  writeFileSync(tmpScript, script);
  const result = execSync(
    `echo '${json}' | ${PYTHON} ${tmpScript}`,
    { encoding: "utf-8", timeout: 60_000 },
  ).trim();
  return result.split("\n").map((l) => l === "1");
};

// ─── Rust bridge ─────────────────────────────

const hasRust = (): boolean => {
  try {
    execSync(`test -f ${RUST_ORACLE}`, {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};

const rustBatch = (
  format: string,
  values: readonly string[],
): boolean[] => {
  const json = JSON.stringify(values);
  const result = execSync(
    `echo '${json}' | ${RUST_ORACLE} ${format}`,
    { encoding: "utf-8", timeout: 60_000 },
  ).trim();
  return result.split("\n").map((l) => l === "1");
};

// ─── Ruby bridge ─────────────────────────────

const hasRuby = (): boolean => {
  try {
    execSync(
      `GEM_HOME=${RUBY_GEM_DIR} ruby -e "require 'valvat'"`,
      { stdio: "ignore" },
    );
    return true;
  } catch {
    return false;
  }
};

const rubyBatch = (
  values: readonly string[],
  countryPrefix: string,
): boolean[] => {
  const json = JSON.stringify(values);
  const { writeFileSync } = require("node:fs");
  const tmpScript = "/tmp/_stdnum_oracle.rb";
  writeFileSync(
    tmpScript,
    `require 'json'
require 'valvat'
vals = JSON.parse(STDIN.read)
vals.each do |v|
  vat = Valvat.new("${countryPrefix}" + v)
  puts vat.valid_checksum? ? "1" : "0"
end`,
  );
  const result = execSync(
    `echo '${json}' | GEM_HOME=${RUBY_GEM_DIR} ruby ${tmpScript}`,
    { encoding: "utf-8", timeout: 60_000 },
  ).trim();
  return result.split("\n").map((l) => l === "1");
};

// ─── Spec definitions ────────────────────────

type OracleSpec = {
  name: string;
  pyModule: string;
  tsValidate: (v: string) => boolean;
  arb: fc.Arbitrary<string>;
};

const rawDigs = (n: number): fc.Arbitrary<string> =>
  fc
    .array(fc.integer({ min: 0, max: 9 }), {
      minLength: n,
      maxLength: n,
    })
    .map((ds: number[]) => ds.join(""));

/**
 * Generate n-digit strings with edge cases mixed
 * in (Hypothesis-style). 70% random, 30% targeted
 * boundary values: all-zeros, all-nines, repeated
 * digits, off-by-one lengths.
 */
const digs = (n: number): fc.Arbitrary<string> => {
  const edges: fc.Arbitrary<string>[] = [
    fc.constant("0".repeat(n)),
    fc.constant("9".repeat(n)),
    fc.constant(
      "0123456789".repeat(Math.ceil(n / 10)).slice(0, n),
    ),
  ];
  for (let d = 1; d < 9; d++) {
    edges.push(fc.constant(String(d).repeat(n)));
  }
  if (n > 1) edges.push(rawDigs(n - 1));
  edges.push(rawDigs(n + 1));
  return fc.oneof(
    { weight: 70, arbitrary: rawDigs(n) },
    ...edges.map((e) => ({
      weight: Math.max(1, Math.floor(30 / edges.length)),
      arbitrary: e,
    })),
  );
};

const digsRange = (
  min: number,
  max: number,
): fc.Arbitrary<string> =>
  fc.integer({ min, max }).chain((n: number) => digs(n));

const SPECS: OracleSpec[] = [
  // python-stdnum has no cz.ico; cz.dic covers
  // 8-digit legal entities with the same checksum
  {
    name: "CZ DIČ (covers IČO)",
    pyModule: "cz.dic",
    tsValidate: (v) => cz.dic.validate(v).valid,
    arb: digsRange(8, 10),
  },
  {
    name: "CZ RČ",
    pyModule: "cz.rc",
    tsValidate: (v) => cz.rc.validate(v).valid,
    arb: fc.oneof(digs(9), digs(10)),
  },
  {
    name: "SK IČ DPH",
    pyModule: "sk.dph",
    tsValidate: (v) => sk.dic.validate(v).valid,
    arb: digs(10),
  },
  {
    name: "DE IdNr",
    pyModule: "de.idnr",
    tsValidate: (v) => de.idnr.validate(v).valid,
    arb: digs(11),
  },
  {
    name: "PL NIP",
    pyModule: "pl.nip",
    tsValidate: (v) => pl.nip.validate(v).valid,
    arb: digs(10),
  },
  {
    name: "PL PESEL",
    pyModule: "pl.pesel",
    tsValidate: (v) => pl.pesel.validate(v).valid,
    arb: digs(11),
  },
  {
    name: "PL REGON",
    pyModule: "pl.regon",
    tsValidate: (v) => pl.regon.validate(v).valid,
    arb: fc.oneof(digs(9), digs(14)),
  },
  {
    // KNOWN: python-stdnum validates BBAN format
    // (country-specific regex); we only check
    // mod-97. A few false positives are expected.
    name: "IBAN (mod-97 only, BBAN not checked)",
    pyModule: "iban",
    tsValidate: (v) => ibanValidator.validate(v).valid,
    arb: fc
      .tuple(
        fc.constantFrom(
          "CZ",
          "DE",
          "SK",
          "PL",
          "GB",
          "FR",
          "AT",
          "NL",
          "IT",
          "ES",
        ),
        digs(2),
        fc
          .array(
            fc.constantFrom(
              ..."0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
                "",
              ),
            ),
            { minLength: 12, maxLength: 26 },
          )
          .map((chars: string[]) => chars.join("")),
      )
      .map(([cc, check, bban]) => `${cc}${check}${bban}`),
  },
  {
    name: "Credit Card (Luhn)",
    pyModule: "luhn",
    tsValidate: (v) => luhnValidator.validate(v).valid,
    arb: digsRange(13, 19),
  },
  // ── Wave 2 countries ──────────────────────
  {
    name: "AT UID",
    pyModule: "at.uid",
    tsValidate: (v) => at.uid.validate(v).valid,
    arb: digs(8).map((d) => `U${d}`),
  },
  {
    name: "GB VAT",
    pyModule: "gb.vat",
    tsValidate: (v) => gb.vat.validate(v).valid,
    arb: digs(9),
  },
  {
    name: "GB UTR",
    pyModule: "gb.utr",
    tsValidate: (v) => gb.utr.validate(v).valid,
    arb: digs(10),
  },
  {
    name: "FR SIREN",
    pyModule: "fr.siren",
    tsValidate: (v) => fr.siren.validate(v).valid,
    arb: digs(9),
  },
  {
    name: "FR SIRET",
    pyModule: "fr.siret",
    tsValidate: (v) => fr.siret.validate(v).valid,
    arb: digs(14),
  },
  {
    name: "FR NIF",
    pyModule: "fr.nif",
    tsValidate: (v) => fr.nif.validate(v).valid,
    arb: digs(13),
  },
  {
    name: "FR TVA",
    pyModule: "fr.tva",
    tsValidate: (v) => fr.tva.validate(v).valid,
    arb: fc
      .tuple(digs(2), digs(9))
      .map(([prefix, siren]) => `${prefix}${siren}`),
  },
  {
    name: "IT Partita IVA",
    pyModule: "it.iva",
    tsValidate: (v) => it.iva.validate(v).valid,
    arb: digs(11),
  },
  {
    name: "IT Codice Fiscale",
    pyModule: "it.codicefiscale",
    tsValidate: (v) => it.codiceFiscale.validate(v).valid,
    arb: fc
      .tuple(
        fc
          .array(
            fc.constantFrom(
              ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split(
                "",
              ),
            ),
            { minLength: 15, maxLength: 15 },
          )
          .map((c: string[]) => c.join("")),
        fc.constantFrom(
          ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
        ),
      )
      .map(([front, check]) => `${front}${check}`),
  },
  // ── Phase 1: EU-27 VAT ────────────────────
  {
    name: "BE VAT",
    pyModule: "be.vat",
    tsValidate: (v) => be.vat.validate(v).valid,
    arb: digs(10),
  },
  {
    name: "BG VAT",
    pyModule: "bg.vat",
    tsValidate: (v) => bg.vat.validate(v).valid,
    arb: fc.oneof(digs(9), digs(10)),
  },
  {
    name: "CY VAT",
    pyModule: "cy.vat",
    tsValidate: (v) => cy.vat.validate(v).valid,
    arb: fc
      .tuple(
        digs(8),
        fc.constantFrom(
          ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
        ),
      )
      .map(([d, l]) => `${d}${l}`),
  },
  {
    name: "DK VAT",
    pyModule: "dk.cvr",
    tsValidate: (v) => dk.vat.validate(v).valid,
    arb: digs(8),
  },
  {
    name: "EE VAT",
    pyModule: "ee.kmkr",
    tsValidate: (v) => ee.vat.validate(v).valid,
    arb: digs(9),
  },
  {
    name: "ES VAT",
    pyModule: "es.nif",
    tsValidate: (v) => es.vat.validate(v).valid,
    arb: fc.oneof(
      // DNI: 8 digits + letter
      fc
        .tuple(
          digs(8),
          fc.constantFrom(
            ..."TRWAGMYFPDXBNJZSQVHLCKE".split(""),
          ),
        )
        .map(([d, l]) => `${d}${l}`),
      // CIF: letter + 7 digits + check
      fc
        .tuple(
          fc.constantFrom(..."ABCDEFGHJNPQRSUVW".split("")),
          digs(7),
          fc.constantFrom(
            ..."0123456789JABCDEFGHI".split(""),
          ),
        )
        .map(([p, d, c]) => `${p}${d}${c}`),
    ),
  },
  {
    name: "FI VAT",
    pyModule: "fi.alv",
    tsValidate: (v) => fi.vat.validate(v).valid,
    arb: digs(8),
  },
  {
    name: "GR VAT",
    pyModule: "gr.vat",
    tsValidate: (v) => gr.vat.validate(v).valid,
    arb: digs(9),
  },
  {
    name: "HR VAT",
    pyModule: "hr.oib",
    tsValidate: (v) => hr.vat.validate(v).valid,
    arb: digs(11),
  },
  {
    name: "HU VAT",
    pyModule: "hu.anum",
    tsValidate: (v) => hu.vat.validate(v).valid,
    arb: digs(8),
  },
  {
    name: "IE VAT",
    pyModule: "ie.vat",
    tsValidate: (v) => ie.vat.validate(v).valid,
    arb: fc
      .tuple(
        digs(7),
        fc.constantFrom(
          ..."WABCDEFGHIJKLMNOPQRSTUV".split(""),
        ),
      )
      .map(([d, l]) => `${d}${l}`),
  },
  {
    name: "LT VAT",
    pyModule: "lt.pvm",
    tsValidate: (v) => lt.vat.validate(v).valid,
    arb: fc.oneof(digs(9), digs(12)),
  },
  {
    name: "LU VAT",
    pyModule: "lu.tva",
    tsValidate: (v) => lu.vat.validate(v).valid,
    arb: digs(8),
  },
  {
    name: "LV VAT",
    pyModule: "lv.pvn",
    tsValidate: (v) => lv.vat.validate(v).valid,
    arb: digs(11),
  },
  {
    name: "MT VAT",
    pyModule: "mt.vat",
    tsValidate: (v) => mt.vat.validate(v).valid,
    arb: digs(8),
  },
  {
    name: "NL VAT",
    pyModule: "nl.btw",
    tsValidate: (v) => nl.vat.validate(v).valid,
    arb: fc
      .tuple(digs(9), digs(2))
      .map(([d, s]) => `${d}B${s}`),
  },
  {
    name: "PT VAT",
    pyModule: "pt.nif",
    tsValidate: (v) => pt.vat.validate(v).valid,
    arb: digs(9),
  },
  {
    name: "RO VAT",
    pyModule: "ro.cf",
    tsValidate: (v) => ro.vat.validate(v).valid,
    arb: digsRange(2, 10),
  },
  {
    name: "SE VAT",
    pyModule: "se.vat",
    tsValidate: (v) => se.vat.validate(v).valid,
    arb: digs(12),
  },
  {
    name: "SI VAT",
    pyModule: "si.ddv",
    tsValidate: (v) => si.vat.validate(v).valid,
    arb: digs(8),
  },
  // ── Phase 2: EU Personal IDs ──────────────
  {
    name: "BE NN",
    pyModule: "be.nn",
    tsValidate: (v) => be.nn.validate(v).valid,
    arb: digs(11),
  },
  {
    name: "BG EGN",
    pyModule: "bg.egn",
    tsValidate: (v) => bg.egn.validate(v).valid,
    arb: digs(10),
  },
  {
    name: "DK CPR",
    pyModule: "dk.cpr",
    tsValidate: (v) => dk.cpr.validate(v).valid,
    arb: digs(10),
  },
  {
    name: "EE IK",
    pyModule: "ee.ik",
    tsValidate: (v) => ee.ik.validate(v).valid,
    arb: digs(11),
  },
  {
    name: "ES DNI",
    pyModule: "es.dni",
    tsValidate: (v) => es.dni.validate(v).valid,
    arb: fc
      .tuple(
        digs(8),
        fc.constantFrom(
          ..."TRWAGMYFPDXBNJZSQVHLCKE".split(""),
        ),
      )
      .map(([d, l]) => `${d}${l}`),
  },
  {
    name: "ES NIE",
    pyModule: "es.nie",
    tsValidate: (v) => es.nie.validate(v).valid,
    arb: fc
      .tuple(
        fc.constantFrom("X", "Y", "Z"),
        digs(7),
        fc.constantFrom(
          ..."TRWAGMYFPDXBNJZSQVHLCKE".split(""),
        ),
      )
      .map(([p, d, l]) => `${p}${d}${l}`),
  },
  {
    name: "FI HETU",
    pyModule: "fi.hetu",
    tsValidate: (v) => fi.hetu.validate(v).valid,
    arb: fc
      .tuple(
        digs(6),
        fc.constantFrom("-", "A"),
        digs(3),
        fc.constantFrom(
          ..."0123456789ABCDEFHJKLMNPRSTUVWXY".split(""),
        ),
      )
      .map(([d, s, c, x]) => `${d}${s}${c}${x}`),
  },
  {
    name: "GR AMKA",
    pyModule: "gr.amka",
    tsValidate: (v) => gr.amka.validate(v).valid,
    arb: digs(11),
  },
  {
    name: "IE PPS",
    pyModule: "ie.pps",
    tsValidate: (v) => ie.pps.validate(v).valid,
    arb: fc
      .tuple(
        digs(7),
        fc.constantFrom(
          ..."WABCDEFGHIJKLMNOPQRSTUV".split(""),
        ),
      )
      .map(([d, l]) => `${d}${l}`),
  },
  {
    name: "LT Asmens",
    pyModule: "lt.asmens",
    tsValidate: (v) => lt.asmens.validate(v).valid,
    arb: digs(11),
  },
  {
    name: "NL BSN",
    pyModule: "nl.bsn",
    tsValidate: (v) => nl.bsn.validate(v).valid,
    arb: digs(9),
  },
  {
    name: "RO CNP",
    pyModule: "ro.cnp",
    tsValidate: (v) => ro.cnp.validate(v).valid,
    arb: digs(13),
  },
  {
    name: "SE Personnummer",
    pyModule: "se.personnummer",
    tsValidate: (v) => se.personnummer.validate(v).valid,
    arb: digs(10),
  },
  {
    name: "SI EMSO",
    pyModule: "si.emso",
    tsValidate: (v) => si.emso.validate(v).valid,
    arb: digs(13),
  },
];

// ─── JS oracle specs ─────────────────────────

type JsOracleSpec = {
  name: string;
  tsValidate: (v: string) => boolean;
  oracleValidate: (v: string) => boolean;
  arb: fc.Arbitrary<string>;
};

const { nip, pesel, regon } = validatePolish;

const JS_SPECS: JsOracleSpec[] = [
  {
    name: "PL NIP (vs validate-polish)",
    tsValidate: (v) => pl.nip.validate(v).valid,
    oracleValidate: (v) => nip(v),
    arb: digs(10),
  },
  {
    name: "PL PESEL (vs validate-polish)",
    tsValidate: (v) => pl.pesel.validate(v).valid,
    oracleValidate: (v) => pesel(v),
    arb: digs(11),
  },
  {
    name: "PL REGON (vs validate-polish)",
    tsValidate: (v) => pl.regon.validate(v).valid,
    oracleValidate: (v) => regon(v),
    arb: fc.oneof(digs(9), digs(14)),
  },
  {
    name: "IBAN (vs ibantools)",
    tsValidate: (v) => ibanValidator.validate(v).valid,
    oracleValidate: (v) => isValidIBAN(v),
    arb: fc
      .tuple(
        fc.constantFrom(
          "CZ",
          "DE",
          "SK",
          "PL",
          "GB",
          "FR",
          "AT",
          "NL",
          "IT",
          "ES",
        ),
        digs(2),
        fc
          .array(
            fc.constantFrom(
              ..."0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
                "",
              ),
            ),
            { minLength: 12, maxLength: 26 },
          )
          .map((chars: string[]) => chars.join("")),
      )
      .map(([cc, check, bban]) => `${cc}${check}${bban}`),
  },
  {
    name: "IBAN (vs iban.js)",
    tsValidate: (v) => ibanValidator.validate(v).valid,
    oracleValidate: (v) => IBAN.isValid(v) as boolean,
    arb: fc
      .tuple(
        fc.constantFrom(
          "CZ",
          "DE",
          "SK",
          "PL",
          "GB",
          "FR",
          "AT",
          "NL",
          "IT",
          "ES",
        ),
        digs(2),
        fc
          .array(
            fc.constantFrom(
              ..."0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
                "",
              ),
            ),
            { minLength: 12, maxLength: 26 },
          )
          .map((chars: string[]) => chars.join("")),
      )
      .map(([cc, check, bban]) => `${cc}${check}${bban}`),
  },
  {
    name: "Luhn (vs luhn npm)",
    tsValidate: (v) => luhnValidator.validate(v).valid,
    oracleValidate: (v) =>
      v.length >= 13 &&
      v.length <= 19 &&
      (luhnLib.validate(v) as boolean),
    arb: digsRange(13, 19),
  },
  {
    name: "Luhn (vs fast-luhn)",
    tsValidate: (v) => luhnValidator.validate(v).valid,
    oracleValidate: (v) =>
      v.length >= 13 && v.length <= 19 && fastLuhn(v),
    arb: digsRange(13, 19),
  },
  {
    name: "CZ DIČ (vs jsvat)",
    tsValidate: (v) => cz.dic.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`CZ${v}`, [czechRepublic]).isValid,
    arb: digsRange(8, 10),
  },
  {
    name: "DE VAT (vs jsvat)",
    tsValidate: (v) => de.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`DE${v}`, [germany]).isValid,
    arb: fc
      .tuple(fc.integer({ min: 1, max: 9 }), digs(8))
      .map(([first, rest]) => `${String(first)}${rest}`),
  },
  {
    name: "PL NIP (vs jsvat)",
    tsValidate: (v) => pl.nip.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`PL${v}`, [poland]).isValid,
    arb: digs(10),
  },
  // ── EU VAT via jsvat ──────────────────────
  {
    name: "BE VAT (vs jsvat)",
    tsValidate: (v) => be.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`BE${v}`, [belgium]).isValid,
    arb: digs(10),
  },
  {
    name: "BG VAT (vs jsvat)",
    tsValidate: (v) => bg.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`BG${v}`, [bulgaria]).isValid,
    arb: fc.oneof(digs(9), digs(10)),
  },
  {
    name: "CY VAT (vs jsvat)",
    tsValidate: (v) => cy.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`CY${v}`, [cyprus]).isValid,
    arb: fc
      .tuple(
        digs(8),
        fc.constantFrom(
          ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
        ),
      )
      .map(([d, l]) => `${d}${l}`),
  },
  {
    name: "DK VAT (vs jsvat)",
    tsValidate: (v) => dk.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`DK${v}`, [denmark]).isValid,
    arb: digs(8),
  },
  {
    name: "EE VAT (vs jsvat)",
    tsValidate: (v) => ee.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`EE${v}`, [estonia]).isValid,
    arb: digs(9),
  },
  {
    name: "ES VAT (vs jsvat)",
    tsValidate: (v) => es.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`ES${v}`, [spain]).isValid,
    arb: fc.oneof(
      fc
        .tuple(
          digs(8),
          fc.constantFrom(
            ..."TRWAGMYFPDXBNJZSQVHLCKE".split(""),
          ),
        )
        .map(([d, l]) => `${d}${l}`),
      fc
        .tuple(
          fc.constantFrom(..."ABCDEFGHJNPQRSUVW".split("")),
          digs(7),
          fc.constantFrom(
            ..."0123456789JABCDEFGHI".split(""),
          ),
        )
        .map(([p, d, c]) => `${p}${d}${c}`),
    ),
  },
  {
    name: "FI VAT (vs jsvat)",
    tsValidate: (v) => fi.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`FI${v}`, [finland]).isValid,
    arb: digs(8),
  },
  {
    name: "GR VAT (vs jsvat)",
    tsValidate: (v) => gr.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`EL${v}`, [greece]).isValid,
    arb: digs(9),
  },
  {
    name: "HR VAT (vs jsvat)",
    tsValidate: (v) => hr.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`HR${v}`, [croatia]).isValid,
    arb: digs(11),
  },
  {
    name: "HU VAT (vs jsvat)",
    tsValidate: (v) => hu.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`HU${v}`, [hungary]).isValid,
    arb: digs(8),
  },
  {
    name: "IE VAT (vs jsvat)",
    tsValidate: (v) => ie.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`IE${v}`, [ireland]).isValid,
    arb: fc
      .tuple(
        digs(7),
        fc.constantFrom(
          ..."WABCDEFGHIJKLMNOPQRSTUV".split(""),
        ),
      )
      .map(([d, l]) => `${d}${l}`),
  },
  {
    name: "IT IVA (vs jsvat)",
    tsValidate: (v) => it.iva.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`IT${v}`, [italy]).isValid,
    arb: digs(11),
  },
  {
    name: "LT VAT (vs jsvat)",
    tsValidate: (v) => lt.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`LT${v}`, [lithuania]).isValid,
    arb: fc.oneof(digs(9), digs(12)),
  },
  {
    name: "LU VAT (vs jsvat)",
    tsValidate: (v) => lu.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`LU${v}`, [luxembourg]).isValid,
    arb: digs(8),
  },
  {
    name: "LV VAT (vs jsvat)",
    tsValidate: (v) => lv.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`LV${v}`, [latvia]).isValid,
    arb: digs(11),
  },
  {
    name: "MT VAT (vs jsvat)",
    tsValidate: (v) => mt.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`MT${v}`, [malta]).isValid,
    arb: digs(8),
  },
  {
    name: "NL VAT (vs jsvat)",
    tsValidate: (v) => nl.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`NL${v}`, [netherlands]).isValid,
    arb: fc
      .tuple(digs(9), digs(2))
      .map(([d, s]) => `${d}B${s}`),
  },
  {
    name: "PT VAT (vs jsvat)",
    tsValidate: (v) => pt.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`PT${v}`, [portugal]).isValid,
    arb: digs(9),
  },
  {
    name: "RO VAT (vs jsvat)",
    tsValidate: (v) => ro.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`RO${v}`, [romania]).isValid,
    arb: digsRange(2, 10),
  },
  {
    name: "SE VAT (vs jsvat)",
    tsValidate: (v) => se.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`SE${v}`, [sweden]).isValid,
    arb: digs(12),
  },
  {
    name: "SI VAT (vs jsvat)",
    tsValidate: (v) => si.vat.validate(v).valid,
    oracleValidate: (v) =>
      checkVAT(`SI${v}`, [slovenia]).isValid,
    arb: digs(8),
  },
  // ── Personal IDs via stdnum-js ─────────────
  {
    name: "BE NN (vs stdnum-js)",
    tsValidate: (v) => be.nn.validate(v).valid,
    oracleValidate: (v) =>
      stdnumValidatePerson("BE", v).isValid,
    arb: digs(11),
  },
  {
    name: "BG EGN (vs stdnum-js)",
    tsValidate: (v) => bg.egn.validate(v).valid,
    oracleValidate: (v) =>
      stdnumValidatePerson("BG", v).isValid,
    arb: digs(10),
  },
  {
    name: "DK CPR (vs stdnum-js)",
    tsValidate: (v) => dk.cpr.validate(v).valid,
    oracleValidate: (v) =>
      stdnumValidatePerson("DK", v).isValid,
    arb: digs(10),
  },
  {
    name: "EE IK (vs stdnum-js)",
    tsValidate: (v) => ee.ik.validate(v).valid,
    oracleValidate: (v) =>
      stdnumValidatePerson("EE", v).isValid,
    arb: digs(11),
  },
  {
    name: "ES DNI (vs stdnum-js)",
    tsValidate: (v) => es.dni.validate(v).valid,
    oracleValidate: (v) =>
      stdnumValidatePerson("ES", v).isValid,
    arb: fc
      .tuple(
        digs(8),
        fc.constantFrom(
          ..."TRWAGMYFPDXBNJZSQVHLCKE".split(""),
        ),
      )
      .map(([d, l]) => `${d}${l}`),
  },
  {
    name: "FI HETU (vs stdnum-js)",
    tsValidate: (v) => fi.hetu.validate(v).valid,
    oracleValidate: (v) =>
      stdnumValidatePerson("FI", v).isValid,
    arb: fc
      .tuple(
        digs(6),
        fc.constantFrom("-", "A"),
        digs(3),
        fc.constantFrom(
          ..."0123456789ABCDEFHJKLMNPRSTUVWXY".split(""),
        ),
      )
      .map(([d, s, c, x]) => `${d}${s}${c}${x}`),
  },
  {
    name: "GR AMKA (vs stdnum-js)",
    tsValidate: (v) => gr.amka.validate(v).valid,
    oracleValidate: (v) =>
      stdnumValidatePerson("GR", v).isValid,
    arb: digs(11),
  },
  {
    name: "IE PPS (vs stdnum-js)",
    tsValidate: (v) => ie.pps.validate(v).valid,
    oracleValidate: (v) =>
      stdnumValidatePerson("IE", v).isValid,
    arb: fc
      .tuple(
        digs(7),
        fc.constantFrom(
          ..."WABCDEFGHIJKLMNOPQRSTUV".split(""),
        ),
      )
      .map(([d, l]) => `${d}${l}`),
  },
  {
    name: "LT Asmens (vs stdnum-js)",
    tsValidate: (v) => lt.asmens.validate(v).valid,
    oracleValidate: (v) =>
      stdnumValidatePerson("LT", v).isValid,
    arb: digs(11),
  },
  {
    name: "NL BSN (vs stdnum-js)",
    tsValidate: (v) => nl.bsn.validate(v).valid,
    oracleValidate: (v) =>
      stdnumValidatePerson("NL", v).isValid,
    arb: digs(9),
  },
  {
    name: "RO CNP (vs stdnum-js)",
    tsValidate: (v) => ro.cnp.validate(v).valid,
    oracleValidate: (v) =>
      stdnumValidatePerson("RO", v).isValid,
    arb: digs(13),
  },
  {
    name: "SE Personnummer (vs stdnum-js)",
    tsValidate: (v) => se.personnummer.validate(v).valid,
    oracleValidate: (v) =>
      stdnumValidatePerson("SE", v).isValid,
    arb: digs(10),
  },
  {
    name: "SI EMSO (vs stdnum-js)",
    tsValidate: (v) => si.emso.validate(v).valid,
    oracleValidate: (v) =>
      stdnumValidatePerson("SI", v).isValid,
    arb: digs(13),
  },
];

// ─── Mutant testing ─────────────────────────
//
// For each valid value found, generate "mutants"
// by flipping single digits. If the checksum is
// correct, every single-digit mutation should
// produce an invalid result. Any mutant that
// passes validation is a checksum weakness.

type MutantSpec = {
  name: string;
  tsValidate: (v: string) => boolean;
  arb: fc.Arbitrary<string>;
};

/**
 * Generate single-digit mutants of a valid value.
 * For each position, try replacing the digit with
 * every other digit (0-9). Returns the mutant
 * strings that should all be invalid.
 */
const mutate = (value: string): string[] => {
  const mutants: string[] = [];
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === undefined || ch < "0" || ch > "9") {
      continue; // skip non-digit positions
    }
    for (let d = 0; d <= 9; d++) {
      const replacement = String(d);
      if (replacement === ch) continue;
      mutants.push(
        value.slice(0, i) +
          replacement +
          value.slice(i + 1),
      );
    }
  }
  return mutants;
};

const MUTANT_SPECS: MutantSpec[] = [
  {
    name: "CZ IČO",
    tsValidate: (v) => cz.ico.validate(v).valid,
    arb: digs(8),
  },
  {
    name: "CZ RČ",
    tsValidate: (v) => cz.rc.validate(v).valid,
    arb: digs(10),
  },
  {
    name: "PL NIP",
    tsValidate: (v) => pl.nip.validate(v).valid,
    arb: digs(10),
  },
  {
    name: "IBAN",
    tsValidate: (v) => ibanValidator.validate(v).valid,
    arb: fc.constant("CZ6508000000192000145399"),
  },
  {
    name: "Luhn",
    tsValidate: (v) => luhnValidator.validate(v).valid,
    arb: fc.constant("4111111111111111"),
  },
  {
    name: "DE VAT",
    tsValidate: (v) => de.vat.validate(v).valid,
    arb: digs(9),
  },
  {
    name: "FR SIREN",
    tsValidate: (v) => fr.siren.validate(v).valid,
    arb: digs(9),
  },
  {
    name: "IT IVA",
    tsValidate: (v) => it.iva.validate(v).valid,
    arb: digs(11),
  },
  {
    name: "BE NN",
    tsValidate: (v) => be.nn.validate(v).valid,
    arb: digs(11),
  },
  {
    name: "NL BSN",
    tsValidate: (v) => nl.bsn.validate(v).valid,
    arb: digs(9),
  },
  {
    name: "EE IK",
    tsValidate: (v) => ee.ik.validate(v).valid,
    arb: digs(11),
  },
  {
    name: "SI EMŠO",
    tsValidate: (v) => si.emso.validate(v).valid,
    arb: digs(13),
  },
  {
    name: "HR OIB",
    tsValidate: (v) => hr.vat.validate(v).valid,
    arb: digs(11),
  },
  {
    name: "GB UTR",
    tsValidate: (v) => gb.utr.validate(v).valid,
    arb: digs(10),
  },
];

// ─── Runner ──────────────────────────────────

const NUM_SAMPLES = Number(
  process.env["ORACLE_SAMPLES"] ?? "10000",
);

const compare = (
  label: string,
  values: readonly string[],
  tsResults: readonly boolean[],
  oracleResults: readonly boolean[],
  oracleName: string,
): number => {
  let disagreements = 0;
  const examples: string[] = [];
  for (let i = 0; i < values.length; i++) {
    if (tsResults[i] !== oracleResults[i]) {
      disagreements++;
      if (examples.length < 3) {
        examples.push(
          `    "${String(values[i])}"` +
            ` ts=${String(tsResults[i])}` +
            ` ${oracleName}=${String(oracleResults[i])}`,
        );
      }
    }
  }
  const valid = tsResults.filter(Boolean).length;
  const icon = disagreements === 0 ? "✓" : "✗";
  console.log(
    `  ${icon} ${label}:` +
      ` ${String(disagreements)} disagreements` +
      ` (${String(valid)}/${String(values.length)} valid)`,
  );
  for (const ex of examples) {
    console.log(ex);
  }
  return disagreements;
};

const run = () => {
  let total = 0;
  let failures = 0;

  // ── JS oracles (always run) ──────────────
  console.log(
    `JS oracles: ${String(NUM_SAMPLES)} samples` +
      ` per format\n`,
  );

  for (const spec of JS_SPECS) {
    const values = fc.sample(spec.arb, NUM_SAMPLES);
    const tsResults = values.map(spec.tsValidate);
    const oracleResults = values.map(spec.oracleValidate);
    failures += compare(
      spec.name,
      values,
      tsResults,
      oracleResults,
      "oracle",
    );
    total += values.length;
  }

  // ── Python oracle (optional) ─────────────
  const pyAvailable = hasPython();
  if (pyAvailable) {
    console.log(
      `\nPython oracle: ${String(NUM_SAMPLES)}` +
        ` samples per format\n`,
    );

    for (const spec of SPECS) {
      const values = fc.sample(spec.arb, NUM_SAMPLES);
      const tsResults = values.map(spec.tsValidate);
      let pyResults: boolean[];
      try {
        pyResults = pyBatch(spec.pyModule, values);
      } catch {
        console.log(`  SKIP ${spec.name}`);
        continue;
      }
      failures += compare(
        spec.name,
        values,
        tsResults,
        pyResults,
        "py",
      );
      total += values.length;
    }
  } else {
    console.log("\nPython oracle: skipped (no .venv)");
  }

  // ── Rust oracle (optional) ────────────────
  if (hasRust()) {
    console.log(
      `\nRust oracle: ${String(NUM_SAMPLES)}` +
        ` samples per format\n`,
    );

    // IBAN via iban_validate crate
    const ibanVals = fc.sample(
      fc
        .tuple(
          fc.constantFrom(
            "CZ",
            "DE",
            "SK",
            "PL",
            "GB",
            "FR",
            "AT",
            "NL",
            "IT",
            "ES",
          ),
          digs(2),
          fc
            .array(
              fc.constantFrom(
                ..."0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
                  "",
                ),
              ),
              { minLength: 12, maxLength: 26 },
            )
            .map((c: string[]) => c.join("")),
        )
        .map(([cc, check, bban]) => `${cc}${check}${bban}`),
      NUM_SAMPLES,
    );
    const ibanTs = ibanVals.map(
      (v) => ibanValidator.validate(v).valid,
    );
    const ibanRust = rustBatch("iban", ibanVals);
    failures += compare(
      "IBAN (vs Rust iban_validate)",
      ibanVals,
      ibanTs,
      ibanRust,
      "rust",
    );
    total += ibanVals.length;

    // Luhn via Rust luhn crate
    const luhnVals = fc.sample(
      digsRange(13, 19),
      NUM_SAMPLES,
    );
    const luhnTs = luhnVals.map(
      (v) => luhnValidator.validate(v).valid,
    );
    const luhnRust = rustBatch("luhn", luhnVals);
    failures += compare(
      "Luhn (vs Rust luhn crate)",
      luhnVals,
      luhnTs,
      luhnRust,
      "rust",
    );
    total += luhnVals.length;
  } else {
    console.log(
      "\nRust oracle: skipped" +
        " (build: cd scripts/rust-oracle" +
        " && cargo build --release)",
    );
  }

  // ── Ruby oracle (optional) ────────────────
  if (hasRuby()) {
    console.log(
      `\nRuby oracle (valvat): ` +
        `${String(NUM_SAMPLES)} samples\n`,
    );

    const vatSpecs: Array<{
      name: string;
      prefix: string;
      tsValidate: (v: string) => boolean;
      arb: fc.Arbitrary<string>;
    }> = [
      {
        name: "CZ DIČ (vs valvat)",
        prefix: "CZ",
        tsValidate: (v) => cz.dic.validate(v).valid,
        arb: digsRange(8, 10),
      },
      {
        name: "DE VAT (vs valvat)",
        prefix: "DE",
        tsValidate: (v) => de.vat.validate(v).valid,
        arb: fc
          .tuple(fc.integer({ min: 1, max: 9 }), digs(8))
          .map(([f, r]) => `${String(f)}${r}`),
      },
      {
        name: "PL NIP (vs valvat)",
        prefix: "PL",
        tsValidate: (v) => pl.nip.validate(v).valid,
        arb: digs(10),
      },
    ];

    for (const spec of vatSpecs) {
      const values = fc.sample(spec.arb, NUM_SAMPLES);
      const tsResults = values.map(spec.tsValidate);
      let rubyResults: boolean[];
      try {
        rubyResults = rubyBatch(values, spec.prefix);
      } catch {
        console.log(`  SKIP ${spec.name}`);
        continue;
      }
      failures += compare(
        spec.name,
        values,
        tsResults,
        rubyResults,
        "ruby",
      );
      total += values.length;
    }
  } else {
    console.log(
      "\nRuby oracle: skipped" +
        " (gem install --user-install valvat)",
    );
  }

  // ── Mutant testing ─────────────────────────
  console.log(
    `\nMutant testing: single-digit corruption\n`,
  );

  let mutantTotal = 0;
  let mutantEscapes = 0;

  for (const spec of MUTANT_SPECS) {
    // Find valid values first
    const candidates = fc.sample(
      spec.arb,
      Math.min(NUM_SAMPLES, 2000),
    );
    const validValues = candidates.filter(spec.tsValidate);

    if (validValues.length === 0) {
      console.log(
        `  SKIP ${spec.name}: no valid values found`,
      );
      continue;
    }

    // Take up to 50 valid values and mutate each
    const toTest = validValues.slice(0, 50);
    let escapes = 0;
    const escapeExamples: string[] = [];

    for (const valid of toTest) {
      const mutants = mutate(valid);
      for (const m of mutants) {
        mutantTotal++;
        if (spec.tsValidate(m)) {
          escapes++;
          if (escapeExamples.length < 3) {
            escapeExamples.push(
              `    "${valid}" → "${m}" (still valid)`,
            );
          }
        }
      }
    }

    const icon = escapes === 0 ? "✓" : "✗";
    console.log(
      `  ${icon} ${spec.name}:` +
        ` ${String(escapes)} escapes` +
        ` (${String(toTest.length)} seeds,` +
        ` ${String(toTest.length * mutate(toTest[0] ?? "").length)} mutants)`,
    );
    for (const ex of escapeExamples) {
      console.log(ex);
    }
    mutantEscapes += escapes;
  }

  console.log(
    `\n${String(total)} oracle total,` +
      ` ${String(failures)} disagreements`,
  );
  console.log(
    `${String(mutantTotal)} mutant total,` +
      ` ${String(mutantEscapes)} escapes`,
  );
  // Mutant escapes are informational (inherent to
  // checksum algorithms), not failures.
  process.exit(failures > 0 ? 1 : 0);
};

run();
