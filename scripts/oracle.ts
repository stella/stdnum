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
import { isValidIBAN } from "ibantools";
import { execSync } from "node:child_process";
import { validatePolish } from "validate-polish";

import { cz, de, pl, sk } from "../src";
import ibanValidator from "../src/iban";
import luhnValidator from "../src/luhn";

// ─── Python bridge ───────────────────────────

const PYTHON = ".venv/bin/python3";

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

  console.log(
    `\n${String(total)} total,` +
      ` ${String(failures)} disagreements`,
  );
  process.exit(failures > 0 ? 1 : 0);
};

run();
