/**
 * Oracle tests: cross-check @stll/stdnum against
 * independent implementations.
 *
 * Auto-discovers ALL validators from ../src.
 * Each oracle backend declares what it validates;
 * matching is automatic via validator key.
 *
 * Run: bun run oracle
 */

import fc from "fast-check";
import fastLuhn from "fast-luhn";
import IBAN from "iban";
import { isValidIBAN } from "ibantools";
import {
  checkVAT,
  belgium, bulgaria, croatia, cyprus,
  czechRepublic, denmark, estonia, finland,
  germany, greece, hungary, ireland, italy,
  latvia, lithuania, luxembourg, malta,
  netherlands, poland, portugal, romania,
  slovenia, spain, sweden, switzerland, norway,
} from "jsvat";
import luhnLib from "luhn";
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import {
  validateEntity as stdnumEntity,
  validatePerson as stdnumPerson,
} from "stdnum";
import { validatePolish } from "validate-polish";

import * as all from "../src";
import type { Validator } from "../src/types";

// ─── Auto-discover validators ───────────────

type Discovered = {
  key: string;
  country?: string;
  entityType: string;
  validator: Validator;
};

const isValidator = (v: unknown): v is Validator =>
  Boolean(
    v && typeof v === "object" &&
      "validate" in v && "compact" in v &&
      "format" in v && "entityType" in v,
  );

const discover = (): Discovered[] => {
  const result: Discovered[] = [];
  for (const [ns, mod] of Object.entries(all)) {
    if (isValidator(mod)) {
      result.push({
        key: ns, country: mod.country,
        entityType: mod.entityType, validator: mod,
      });
    } else if (mod && typeof mod === "object") {
      for (const [k, v] of Object.entries(
        mod as Record<string, unknown>,
      )) {
        if (isValidator(v)) {
          result.push({
            key: `${ns}.${k}`, country: v.country,
            entityType: v.entityType, validator: v,
          });
        }
      }
    }
  }
  return result;
};

// ─── Arbitrary generators ───────────────────

const rawDigs = (n: number): fc.Arbitrary<string> =>
  fc.array(fc.integer({ min: 0, max: 9 }), {
    minLength: n, maxLength: n,
  }).map((ds: number[]) => ds.join(""));

const digs = (n: number): fc.Arbitrary<string> => {
  const edges: fc.Arbitrary<string>[] = [
    fc.constant("0".repeat(n)),
    fc.constant("9".repeat(n)),
  ];
  for (let d = 1; d < 9; d++)
    edges.push(fc.constant(String(d).repeat(n)));
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

const digsRange = (a: number, b: number) =>
  fc.integer({ min: a, max: b }).chain((n) => digs(n));

const datePrefix = (
  order: "ymd" | "dmy",
): string[] => {
  const now = new Date();
  const [y, m, d] = [
    now.getFullYear(), now.getMonth() + 1,
    now.getDate(),
  ];
  const p2 = (n: number) =>
    String(n).padStart(2, "0");
  const dates: [number, number, number][] = [
    [y, m, d], [y, m, d + 1], [y, m, d - 1],
    [2000, 1, 1], [1999, 12, 31], [1900, 1, 1],
  ];
  return dates.map(([yr, mo, dy]) =>
    order === "ymd"
      ? `${String(yr).slice(-2)}${p2(mo)}${p2(dy)}`
      : `${p2(dy)}${p2(mo)}${String(yr).slice(-2)}`,
  );
};

const dateDigs = (
  len: number, order: "ymd" | "dmy" = "dmy",
) => {
  const pfxs = datePrefix(order);
  const sLen = len - 6;
  if (sLen < 0) return digs(len);
  return fc.oneof(
    { weight: 70, arbitrary: digs(len) },
    ...pfxs.map((pfx) => ({
      weight: Math.max(1, Math.floor(30 / pfxs.length)),
      arbitrary: rawDigs(sLen).map(
        (s) => `${pfx}${s}`,
      ),
    })),
  );
};

const alnumStr = (min: number, max: number) =>
  fc.array(
    fc.constantFrom(
      ..."0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        .split(""),
    ),
    { minLength: min, maxLength: max },
  ).map((c: string[]) => c.join(""));

const letters = (chars: string) =>
  fc.constantFrom(...chars.split(""));

// ─── Custom arb overrides ───────────────────
// Where inferArb (lengths-based) is insufficient.

const L = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const HETU_SEP = [
  "+", "-", "Y", "X", "W", "V",
  "U", "A", "B", "C", "D", "E", "F",
];
const HETU_CHK = "0123456789ABCDEFHJKLMNPRSTUVWXY";
const ES_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const IE_LETTERS = "WABCDEFGHIJKLMNOPQRSTUV";
const CIF_PFX = "ABCDEFGHJNPQRSUVW";
const CIF_CHK = "0123456789JABCDEFGHI";

const CUSTOM_ARB: Record<string, fc.Arbitrary<string>> =
  {
    "at.uid": digs(8).map((d) => `U${d}`),
    "ch.uid": digs(9).map((d) => `CHE${d}`),
    "ch.vat": digs(9).map((d) => `CHE${d}`),
    "ch.ssn": digs(10).map((d) => `756${d}`),
    "gb.nino": fc.tuple(
      letters(L), letters(L), digs(6),
      fc.constantFrom("A", "B", "C", "D"),
    ).map(([a, b, d, s]) => `${a}${b}${d}${s}`),
    "cz.dic": digsRange(8, 10),
    "cz.rc": fc.oneof(
      dateDigs(9, "ymd"), dateDigs(10, "ymd"),
    ),
    "sk.rc": fc.oneof(
      dateDigs(9, "ymd"), dateDigs(10, "ymd"),
    ),
    "pl.pesel": dateDigs(11, "ymd"),
    "be.nn": dateDigs(11, "ymd"),
    "bg.egn": dateDigs(10, "ymd"),
    "dk.cpr": dateDigs(10),
    "ee.ik": dateDigs(11, "ymd"),
    "lt.asmens": dateDigs(11, "ymd"),
    "gr.amka": dateDigs(11),
    "si.emso": dateDigs(13),
    "no.fodselsnummer": dateDigs(11),
    "is_.kennitala": dateDigs(10),
    "de.svnr": fc.tuple(
      digs(2), dateDigs(6), letters(L), digs(3),
    ).map(([a, d, l, s]) => `${a}${d}${l}${s}`),
    "de.vat": fc.tuple(
      fc.integer({ min: 1, max: 9 }), digs(8),
    ).map(([f, r]) => `${String(f)}${r}`),
    "tr.tckimlik": fc.tuple(
      fc.integer({ min: 1, max: 9 }).map(String),
      digs(10),
    ).map(([f, r]) => `${f}${r}`),
    "fr.nir": fc.tuple(
      fc.constantFrom("1", "2"), digs(12), digs(2),
    ).map(([g, body, ck]) => `${g}${body}${ck}`),
    "fr.tva": fc.tuple(digs(2), digs(9))
      .map(([p, s]) => `${p}${s}`),
    "cy.vat": fc.tuple(digs(8), letters(L))
      .map(([d, l]) => `${d}${l}`),
    "ie.vat": fc.tuple(digs(7), letters(IE_LETTERS))
      .map(([d, l]) => `${d}${l}`),
    "ie.pps": fc.oneof(
      fc.tuple(digs(7), letters(IE_LETTERS))
        .map(([d, l]) => `${d}${l}`),
      fc.tuple(
        digs(7), letters(IE_LETTERS),
        fc.constantFrom("A", "B", "H"),
      ).map(([d, l1, l2]) => `${d}${l1}${l2}`),
    ),
    "nl.vat": fc.tuple(digs(9), digs(2))
      .map(([d, s]) => `${d}B${s}`),
    "es.vat": fc.oneof(
      fc.tuple(digs(8), letters(ES_LETTERS))
        .map(([d, l]) => `${d}${l}`),
      fc.tuple(
        letters(CIF_PFX), digs(7), letters(CIF_CHK),
      ).map(([p, d, c]) => `${p}${d}${c}`),
    ),
    "es.dni": fc.tuple(digs(8), letters(ES_LETTERS))
      .map(([d, l]) => `${d}${l}`),
    "es.nie": fc.tuple(
      fc.constantFrom("X", "Y", "Z"),
      digs(7), letters(ES_LETTERS),
    ).map(([p, d, l]) => `${p}${d}${l}`),
    "es.cif": fc.tuple(
      letters(CIF_PFX), digs(7), letters(CIF_CHK),
    ).map(([p, d, c]) => `${p}${d}${c}`),
    "fi.hetu": fc.tuple(
      digs(6), fc.constantFrom(...HETU_SEP),
      digs(3), letters(HETU_CHK),
    ).map(([d, s, c, x]) => `${d}${s}${c}${x}`),
    "it.codiceFiscale": fc.tuple(
      alnumStr(15, 15), letters(L),
    ).map(([f, c]) => `${f}${c}`),
    "se.personnummer": fc.oneof(
      digs(10),
      fc.tuple(digs(6), digs(4))
        .map(([d, s]) => `${d}+${s}`),
      digs(12),
    ),
    "br.cnpj": fc.oneof(
      digs(14),
      fc.array(fc.oneof(
        fc.integer({ min: 0, max: 9 }).map(String),
        fc.integer({ min: 65, max: 90 })
          .map((c) => String.fromCharCode(c)),
      ), { minLength: 14, maxLength: 14 })
        .map((ch) => ch.join("")),
    ),
    "ca.bn": fc.oneof(
      digs(9),
      fc.tuple(
        digs(9),
        fc.constantFrom("RC", "RM", "RP", "RT"),
        digs(4),
      ).map(([r, p, f]) => `${r}${p}${f}`),
    ),
    "gh.tin": fc.tuple(
      fc.constantFrom("P", "C", "G", "Q", "V"),
      digs(7),
      fc.constantFrom(
        "0", "1", "2", "3", "4",
        "5", "6", "7", "8", "9", "X",
      ),
    ).map(([p, d, c]) => `${p}00${d}${c}`),
    "za.idnr": dateDigs(13, "ymd"),
    "mu.brn": fc.oneof(
      fc.tuple(
        fc.constantFrom("C", "F"), digs(8),
      ).map(([p, d]) => `${p}${d}`),
      fc.tuple(
        fc.constantFrom("0", "1", "2", "3"), digs(7),
      ).map(([p, d]) => `${p}${d}`),
    ),
    "nz.ird": fc.oneof(digs(8), digs(9)),
    iban: fc.tuple(
      fc.constantFrom(
        "CZ", "DE", "SK", "PL", "GB",
        "FR", "AT", "NL", "IT", "ES",
      ),
      digs(2), alnumStr(12, 26),
    ).map(([cc, ck, bb]) => `${cc}${ck}${bb}`),
    luhn: digsRange(13, 19),
    creditcard: digsRange(13, 19),
    isin: fc.tuple(
      fc.constantFrom(
        "US", "DE", "GB", "FR", "JP",
        "CH", "NL", "IT", "ES", "CA",
      ),
      alnumStr(9, 9),
      fc.integer({ min: 0, max: 9 }).map(String),
    ).map(([cc, id, ck]) => `${cc}${id}${ck}`),
    lei: fc.tuple(alnumStr(18, 18), digs(2))
      .map(([p, c]) => `${p}${c}`),
    bic: fc.tuple(
      fc.array(letters(L), { minLength: 6, maxLength: 6 })
        .map((c: string[]) => c.join("")),
      alnumStr(2, 2),
      fc.oneof(fc.constant(""), alnumStr(3, 3)),
    ).map(([i, l, b]) => `${i}${l}${b}`),
  };

const inferArb = (v: Validator): fc.Arbitrary<string> => {
  const lens = v.lengths;
  if (lens && lens.length > 0) {
    if (lens.length === 1) return digs(lens[0]!);
    return fc.oneof(...lens.map((l) => digs(l)));
  }
  return digs(10);
};

const arbFor = (key: string, v: Validator) =>
  CUSTOM_ARB[key] ?? inferArb(v);

// ─── Subprocess bridges ─────────────────────

const PYTHON = ".venv/bin/python3";
const RUST_BIN =
  "scripts/rust-oracle/target/release/stdnum-oracle";
const RUBY_GEM = (() => {
  try {
    return execSync("ruby -e 'puts Gem.user_dir'", {
      encoding: "utf-8",
    }).trim();
  } catch { return ""; }
})();

const probe = (cmd: string): boolean => {
  try {
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch { return false; }
};

const hasPython = () =>
  probe(`${PYTHON} -c "import stdnum"`);
const hasIdnumbers = () =>
  probe(`${PYTHON} -c "import idnumbers"`);
const hasRust = () =>
  probe(`test -f ${RUST_BIN}`);
const hasRubyValvat = () =>
  probe(`GEM_HOME=${RUBY_GEM} ruby -e "require 'valvat'"`);
const hasRubySsn = () =>
  probe(
    `GEM_HOME=${RUBY_GEM} ruby -e ` +
      `"require 'social_security_number'"`,
  );
const hasPhp = () =>
  probe(
    `php -r "require 'scripts/vendor/autoload.php';"`,
  );

type SubBatch = (
  arg: string, vals: readonly string[],
) => boolean[];

const pyBatch: SubBatch = (mod, vals) => {
  const json = JSON.stringify(vals);
  const s = `import json, sys\nfrom stdnum.${mod} import is_valid\nvals = json.loads(sys.stdin.read())\nfor v in vals:\n    print("1" if is_valid(v) else "0")`;
  writeFileSync("/tmp/_stdnum_oracle.py", s);
  return execSync(
    `${PYTHON} /tmp/_stdnum_oracle.py`,
    { input: json, encoding: "utf-8", timeout: 60_000 },
  ).trim().split("\n").map((l) => l === "1");
};

const pyIdnBatch: SubBatch = (cls, vals) => {
  const [mod, name] = cls.split(".");
  const json = JSON.stringify(vals);
  const s = `import json, sys\nfrom idnumbers.nationalid.${mod} import ${name}\nvals = json.loads(sys.stdin.read())\nfor v in vals:\n    print("1" if ${name}.validate(v) else "0")`;
  writeFileSync("/tmp/_stdnum_idn.py", s);
  return execSync(
    `${PYTHON} /tmp/_stdnum_idn.py`,
    { input: json, encoding: "utf-8", timeout: 60_000 },
  ).trim().split("\n").map((l) => l === "1");
};

const rustBatch: SubBatch = (fmt, vals) => {
  const json = JSON.stringify(vals);
  return execSync(
    `${RUST_BIN} ${fmt}`,
    { input: json, encoding: "utf-8", timeout: 60_000 },
  ).trim().split("\n").map((l) => l === "1");
};

const rubyScript = (
  gem: string,
  body: string,
  vals: readonly string[],
): boolean[] => {
  const json = JSON.stringify(vals);
  const tmp = `/tmp/_stdnum_${gem}.rb`;
  writeFileSync(
    tmp,
    `require 'json'\nrequire '${gem}'\nvals = JSON.parse(STDIN.read)\n${body}`,
  );
  return execSync(
    `GEM_HOME=${RUBY_GEM} ruby ${tmp}`,
    { input: json, encoding: "utf-8", timeout: 60_000 },
  ).trim().split("\n").map((l) => l === "1");
};

const valvatBatch = (
  pfx: string, vals: readonly string[],
) =>
  rubyScript(
    "valvat",
    `vals.each do |v|\n  vat = Valvat.new("${pfx}" + v)\n  puts vat.valid_checksum? ? "1" : "0"\nend`,
    vals,
  );

const ssnBatch = (
  cc: string, vals: readonly string[],
) =>
  rubyScript(
    "social_security_number",
    `vals.each do |v|\n  begin\n    ssn = SocialSecurityNumber::Validator.new({number: v, country_code: '${cc}'})\n    puts ssn.valid? ? "1" : "0"\n  rescue\n    puts "0"\n  end\nend`,
    vals,
  );

const phpBatch = (
  cc: string, vals: readonly string[],
): boolean[] => {
  const json = JSON.stringify(vals);
  writeFileSync(
    "/tmp/_stdnum_oracle.php",
    `<?php\nrequire 'scripts/vendor/autoload.php';\nuse loophp\\Tin\\TIN;\n$vals = json_decode(file_get_contents('php://stdin'), true);\nforeach ($vals as $v) {\n    try { $r = TIN::from($v, '${cc}')->isValid(); echo $r ? "1" : "0"; } catch (Exception $e) { echo "0"; }\n    echo "\\n";\n}`,
  );
  return execSync(
    `php /tmp/_stdnum_oracle.php`,
    { input: json, encoding: "utf-8", timeout: 60_000 },
  ).trim().split("\n").map((l) => l === "1");
};

// ─── Oracle registry maps ───────────────────
// Each map: our validator key → oracle argument.
// ONLY correct same-identifier-type mappings.

// python-stdnum module (key → py module path)
const PY_REMAP: Record<string, string> = {
  "dk.vat": "dk.cvr", "ee.vat": "ee.kmkr",
  "es.vat": "es.nif", "fi.vat": "fi.alv",
  "hr.vat": "hr.oib", "hu.vat": "hu.anum",
  "lt.vat": "lt.pvm", "lu.vat": "lu.tva",
  "lv.vat": "lv.pvn", "nl.vat": "nl.btw",
  "pt.vat": "pt.nif", "ro.vat": "ro.cf",
  "si.vat": "si.ddv",
  "it.codiceFiscale": "it.codicefiscale",
  "do_.rnc": "do.rnc",
};
// Keys to skip (no python-stdnum module exists)
const PY_SKIP = new Set([
  "eu.vat", "bic", "ch.vat", "no.mva",
  "is_.vsk", "nl.kvk", "lei", "creditcard",
  "cz.ico", "sk.dic", "sk.ico", "mu.brn",
]);

// jsvat: key → [jsvat config, VAT prefix]
const jc = (
  cfg: typeof belgium, pfx: string,
): [typeof belgium, string] => [cfg, pfx];

const JSVAT: Record<
  string, [typeof belgium, string]
> = {
  "be.vat": jc(belgium, "BE"),
  "bg.vat": jc(bulgaria, "BG"),
  "hr.vat": jc(croatia, "HR"),
  "cy.vat": jc(cyprus, "CY"),
  "cz.dic": jc(czechRepublic, "CZ"),
  "dk.vat": jc(denmark, "DK"),
  "ee.vat": jc(estonia, "EE"),
  "fi.vat": jc(finland, "FI"),
  "de.vat": jc(germany, "DE"),
  "gr.vat": jc(greece, "EL"),
  "hu.vat": jc(hungary, "HU"),
  "ie.vat": jc(ireland, "IE"),
  "it.iva": jc(italy, "IT"),
  "lv.vat": jc(latvia, "LV"),
  "lt.vat": jc(lithuania, "LT"),
  "lu.vat": jc(luxembourg, "LU"),
  "mt.vat": jc(malta, "MT"),
  "nl.vat": jc(netherlands, "NL"),
  "pl.nip": jc(poland, "PL"),
  "pt.vat": jc(portugal, "PT"),
  "ro.vat": jc(romania, "RO"),
  "si.vat": jc(slovenia, "SI"),
  "es.vat": jc(spain, "ES"),
  "se.vat": jc(sweden, "SE"),
};
// jsvat special wrappers (CH/NO VAT suffixes)
const JSVAT_SPECIAL: Record<
  string,
  [typeof belgium, (v: string) => string]
> = {
  "ch.uid": [switzerland, (v) => `${v}MWST`],
  "no.orgnr": [norway, (v) => `NO${v}MVA`],
};

// stdnum-js: key → country code
const STDNUM_PERSON: Record<string, string> = {
  "be.nn": "BE", "bg.egn": "BG", "dk.cpr": "DK",
  "ee.ik": "EE", "es.dni": "ES", "fi.hetu": "FI",
  "gb.nino": "GB", "gr.amka": "GR", "ie.pps": "IE",
  "lt.asmens": "LT", "nl.bsn": "NL",
  "ro.cnp": "RO", "se.personnummer": "SE",
  "si.emso": "SI", "ch.ssn": "CH",
  "no.fodselsnummer": "NO",
};
const STDNUM_ENTITY: Record<string, string> = {
  "ch.uid": "CH", "no.orgnr": "NO",
};
const STDNUM_MIXED: Record<string, string> = {
  "is_.kennitala": "IS",
};

// validate-polish
const { nip, pesel, regon } = validatePolish;
const POLISH: Record<string, (v: string) => boolean> = {
  "pl.nip": nip, "pl.pesel": pesel, "pl.regon": regon,
};

// idnumbers: key → "Country.ClassName"
const IDNUMBERS: Record<string, string> = {
  "bg.egn": "BGR.UnifiedCivilNumber",
  "cz.rc": "CZE.BirthNumber",
  "ee.ik": "EST.PersonalIdentificationCode",
  "fi.hetu": "FIN.PersonalIdentityCode",
  "lt.asmens": "LTU.PersonalCode",
  "nl.bsn": "NLD.CitizenServiceNumber",
  "ro.cnp": "ROU.PersonalNumericalCode",
  "se.personnummer": "SWE.PersonalIdentityNumber",
  "sk.rc": "SVK.BirthNumber",
  "tr.tckimlik": "TUR.PersonalID",
};

// valvat (Ruby): key → VAT prefix
const VALVAT: Record<string, string> = {
  "at.uid": "AT", "be.vat": "BE", "bg.vat": "BG",
  "hr.vat": "HR", "cy.vat": "CY", "cz.dic": "CZ",
  "de.vat": "DE", "dk.vat": "DK", "ee.vat": "EE",
  "fi.vat": "FI", "gb.vat": "GB", "gr.vat": "EL",
  "hu.vat": "HU", "ie.vat": "IE", "it.iva": "IT",
  "lt.vat": "LT", "lu.vat": "LU", "lv.vat": "LV",
  "mt.vat": "MT", "nl.vat": "NL", "pl.nip": "PL",
  "pt.vat": "PT", "ro.vat": "RO", "se.vat": "SE",
  "si.vat": "SI", "es.vat": "ES", "sk.dic": "SK",
};

// Ruby social_security_number: key → country
const RUBY_SSN: Record<string, string> = {
  "be.nn": "BE", "bg.egn": "BG", "dk.cpr": "DK",
  "ee.ik": "EE", "es.dni": "ES", "fi.hetu": "FI",
  "it.codiceFiscale": "IT", "lt.asmens": "LT",
  "nl.bsn": "NL", "ro.cnp": "RO",
  "se.personnummer": "SE", "si.emso": "SI",
  "no.fodselsnummer": "NO", "cz.rc": "CZ",
  "sk.rc": "SK",
};

// PHP loophp/tin: key → country (TIN only)
// loophp/tin validates EU TIN format specs.
// Only map where our validator IS the TIN.
const PHP_TIN: Record<string, string> = {
  "de.idnr": "DE", "fr.nif": "FR",
  "pl.nip": "PL", "pt.vat": "PT",
};

// ─── Oracle entry type ──────────────────────

type OracleEntry = {
  name: string;
  source: string;
  key: string;
  validate: (vals: string[]) => boolean[] | null;
};

// ─── Build all oracle entries ───────────────

const buildOracles = (): OracleEntry[] => {
  const e: OracleEntry[] = [];
  const safe = (
    name: string, source: string, key: string,
    fn: (vals: string[]) => boolean[],
  ) =>
    e.push({
      name, source, key,
      validate: (vals) => {
        try { return fn(vals); }
        catch { return null; }
      },
    });

  // python-stdnum
  if (hasPython()) {
    for (const d of discover()) {
      if (PY_SKIP.has(d.key)) continue;
      const mod = PY_REMAP[d.key] ?? d.key;
      safe(
        `${d.key} (vs python-stdnum)`,
        "python-stdnum", d.key,
        (v) => pyBatch(mod, v),
      );
    }
  }

  // idnumbers
  if (hasIdnumbers()) {
    for (const [key, cls] of Object.entries(IDNUMBERS))
      safe(
        `${key} (vs idnumbers)`,
        "idnumbers", key, (v) => pyIdnBatch(cls, v),
      );
  }

  // jsvat (always available)
  for (const [key, [cfg, pfx]] of Object.entries(JSVAT))
    e.push({
      name: `${key} (vs jsvat)`,
      source: "jsvat", key,
      validate: (v) =>
        v.map((x) => checkVAT(`${pfx}${x}`, [cfg]).isValid),
    });
  for (const [key, [cfg, wrap]] of Object.entries(
    JSVAT_SPECIAL,
  ))
    e.push({
      name: `${key} (vs jsvat)`,
      source: "jsvat", key,
      validate: (v) =>
        v.map((x) => checkVAT(wrap(x), [cfg]).isValid),
    });

  // stdnum-js
  for (const [key, cc] of Object.entries(STDNUM_PERSON))
    e.push({
      name: `${key} (vs stdnum-js)`,
      source: "stdnum-js", key,
      validate: (v) =>
        v.map((x) => stdnumPerson(cc, x).isValid),
    });
  for (const [key, cc] of Object.entries(STDNUM_ENTITY))
    e.push({
      name: `${key} (vs stdnum-js)`,
      source: "stdnum-js", key,
      validate: (v) =>
        v.map((x) => stdnumEntity(cc, x).isValid),
    });
  for (const [key, cc] of Object.entries(STDNUM_MIXED))
    e.push({
      name: `${key} (vs stdnum-js)`,
      source: "stdnum-js", key,
      validate: (v) =>
        v.map(
          (x) =>
            stdnumPerson(cc, x).isValid ||
            stdnumEntity(cc, x).isValid,
        ),
    });

  // validate-polish
  for (const [key, fn] of Object.entries(POLISH))
    e.push({
      name: `${key} (vs validate-polish)`,
      source: "validate-polish", key,
      validate: (v) => v.map(fn),
    });

  // ibantools + iban.js
  e.push({
    name: "iban (vs ibantools)",
    source: "ibantools", key: "iban",
    validate: (v) => v.map(isValidIBAN),
  });
  e.push({
    name: "iban (vs iban.js)",
    source: "iban.js", key: "iban",
    validate: (v) =>
      v.map((x) => IBAN.isValid(x) as boolean),
  });

  // luhn / fast-luhn (length-gated)
  const luhnGate = (
    fn: (x: string) => boolean,
  ) => (v: string) =>
    v.length >= 13 && v.length <= 19 && fn(v);

  e.push({
    name: "luhn (vs luhn npm)",
    source: "luhn", key: "luhn",
    validate: (v) =>
      v.map(luhnGate((x) => luhnLib.validate(x) as boolean)),
  });
  e.push({
    name: "luhn (vs fast-luhn)",
    source: "fast-luhn", key: "luhn",
    validate: (v) => v.map(luhnGate(fastLuhn)),
  });

  // valvat (Ruby)
  if (hasRubyValvat()) {
    for (const [key, pfx] of Object.entries(VALVAT))
      safe(
        `${key} (vs valvat)`, "valvat", key,
        (v) => valvatBatch(pfx, v),
      );
  }

  // loophp/tin (PHP)
  if (hasPhp()) {
    for (const [key, cc] of Object.entries(PHP_TIN))
      safe(
        `${key} (vs loophp/tin)`, "loophp/tin", key,
        (v) => phpBatch(cc, v),
      );
  }

  // social_security_number (Ruby)
  if (hasRubySsn()) {
    for (const [key, cc] of Object.entries(RUBY_SSN))
      safe(
        `${key} (vs ruby-ssn)`, "ruby-ssn", key,
        (v) => ssnBatch(cc, v),
      );
  }

  // Rust
  if (hasRust()) {
    safe(
      "iban (vs rust)", "rust", "iban",
      (v) => rustBatch("iban", v),
    );
    safe(
      "luhn (vs rust)", "rust", "luhn",
      (v) => rustBatch("luhn", v),
    );
  }

  return e;
};

// ─── Mutant testing ─────────────────────────

const mutate = (value: string): string[] => {
  const out: string[] = [];
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === undefined || ch < "0" || ch > "9")
      continue;
    for (let d = 0; d <= 9; d++) {
      const r = String(d);
      if (r === ch) continue;
      out.push(
        value.slice(0, i) + r + value.slice(i + 1),
      );
    }
  }
  return out;
};

const hasChecksum = (v: Validator): boolean => {
  const ex = v.examples;
  if (!ex || ex.length === 0) return false;
  const c = v.compact(ex[0]!);
  return mutate(c).some((m) => {
    const r = v.validate(m);
    return !r.valid && r.error.code === "INVALID_CHECKSUM";
  });
};

// ─── Runner ─────────────────────────────────

const NUM = Number(
  process.env["ORACLE_SAMPLES"] ?? "10000",
);

const compare = (
  label: string,
  vals: readonly string[],
  ts: readonly boolean[],
  oracle: readonly boolean[],
): number => {
  let dis = 0;
  const ex: string[] = [];
  for (let i = 0; i < vals.length; i++) {
    if (ts[i] !== oracle[i]) {
      dis++;
      if (ex.length < 3)
        ex.push(
          `    "${String(vals[i])}"` +
            ` ts=${String(ts[i])}` +
            ` oracle=${String(oracle[i])}`,
        );
    }
  }
  const v = ts.filter(Boolean).length;
  const icon = dis === 0 ? "\u2713" : "\u2717";
  console.log(
    `  ${icon} ${label}: ${String(dis)} disagreements` +
      ` (${String(v)}/${String(vals.length)} valid)`,
  );
  for (const e of ex) console.log(e);
  return dis;
};

const run = () => {
  const validators = discover();
  const byKey = new Map(validators.map((d) => [d.key, d]));
  const oracles = buildOracles();
  let total = 0;
  let failures = 0;

  console.log(
    `Discovered ${String(validators.length)} validators,` +
      ` ${String(oracles.length)} oracle entries\n`,
  );

  // Group by source
  const bySource = new Map<string, OracleEntry[]>();
  for (const o of oracles) {
    const list = bySource.get(o.source) ?? [];
    list.push(o);
    bySource.set(o.source, list);
  }

  for (const [source, entries] of bySource) {
    console.log(
      `\n${source}: ${String(NUM)} samples per format\n`,
    );
    for (const entry of entries) {
      const d = byKey.get(entry.key);
      if (!d) continue;
      const arb = arbFor(d.key, d.validator);
      const vals = fc.sample(arb, NUM);
      const ts = vals.map(
        (v) => d.validator.validate(v).valid,
      );
      const oracle = entry.validate(vals);
      if (oracle === null) {
        console.log(`  SKIP ${entry.name}`);
        continue;
      }
      failures += compare(entry.name, vals, ts, oracle);
      total += vals.length;
    }
  }

  // Mutant testing
  console.log(
    `\nMutant testing: single-digit corruption\n`,
  );
  let mutTotal = 0;
  let mutEsc = 0;

  for (const d of validators) {
    if (!hasChecksum(d.validator)) continue;
    const arb = arbFor(d.key, d.validator);
    const cands = fc.sample(
      arb, Math.min(NUM, 2000),
    );
    const valid = cands.filter(
      (v) => d.validator.validate(v).valid,
    );
    if (valid.length === 0) {
      console.log(
        `  SKIP ${d.key}: no valid values found`,
      );
      continue;
    }
    const toTest = valid.slice(0, 50);
    let esc = 0;
    const escEx: string[] = [];
    for (const v of toTest) {
      for (const m of mutate(v)) {
        mutTotal++;
        if (d.validator.validate(m).valid) {
          esc++;
          if (escEx.length < 3)
            escEx.push(
              `    "${v}" -> "${m}" (still valid)`,
            );
        }
      }
    }
    const icon = esc === 0 ? "\u2713" : "\u2717";
    const first = toTest[0] ?? "";
    console.log(
      `  ${icon} ${d.key}: ${String(esc)} escapes` +
        ` (${String(toTest.length)} seeds,` +
        ` ${String(toTest.length * mutate(first).length)} mutants)`,
    );
    for (const ex of escEx) console.log(ex);
    mutEsc += esc;
  }

  console.log(
    `\n${String(total)} oracle total,` +
      ` ${String(failures)} disagreements`,
  );
  console.log(
    `${String(mutTotal)} mutant total,` +
      ` ${String(mutEsc)} escapes`,
  );
  process.exit(failures > 0 ? 1 : 0);
};

run();
