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
  czechRepublic,
  germany,
  poland,
} from "jsvat";
import luhnLib from "luhn";
import { execSync } from "node:child_process";
import { validatePolish } from "validate-polish";

import { cz, de, pl, sk } from "../src";
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

const digs = (n: number): fc.Arbitrary<string> =>
  fc
    .array(fc.integer({ min: 0, max: 9 }), {
      minLength: n,
      maxLength: n,
    })
    .map((ds: number[]) => ds.join(""));

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
];

// ─── Runner ──────────────────────────────────

const NUM_SAMPLES = 2000;

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

  console.log(
    `\n${String(total)} total,` +
      ` ${String(failures)} disagreements`,
  );
  process.exit(failures > 0 ? 1 : 0);
};

run();
