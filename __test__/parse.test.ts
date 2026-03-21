/**
 * Auto-discovered parse tests for every validator
 * that exports a `parse` function.
 *
 * Properties tested:
 * 1. parse(invalidInput) returns null
 * 2. parse(validExample) returns a ParsedPersonId
 *    with birthDate instanceof Date and gender
 *    being "male" or "female"
 *
 * Specific date/gender assertions follow below
 * for validators with known expected values.
 *
 * New validators with `parse` get generic tests
 * automatically when added — zero manual wiring.
 */

import { Glob } from "bun";
import { describe, expect, test } from "bun:test";

import type { ParsedPersonId, Validator } from "../src/types";

// ─── Auto-discover every module with parse ─────

type ParseModule = {
  path: string;
  name: string;
  parse: (value: string) => ParsedPersonId | null;
  validator: Validator;
};

const discovered: ParseModule[] = [];

const glob = new Glob("src/**/*.ts");
for await (const file of glob.scan(
  import.meta.dir + "/..",
)) {
  if (
    file.includes("mod.ts") ||
    file.includes("index.ts") ||
    file.includes("types.ts") ||
    file.includes("_util") ||
    file.includes("_checksums")
  )
    continue;

  const mod = await import(`../${file}`);
  if (typeof mod.parse !== "function") continue;

  // Derive a readable name from the path:
  // "src/cz/rc.ts" → "cz.rc"
  const name = file
    .replace("src/", "")
    .replace(".ts", "")
    .replaceAll("/", ".");

  if (!mod.default) {
    throw new Error(
      `${file} exports parse() but no default Validator`,
    );
  }

  discovered.push({
    path: file,
    name,
    parse: mod.parse,
    validator: mod.default,
  });
}

// ─── Generic auto-discovered tests ─────────────

for (const { name, parse, validator } of discovered) {
  describe(`${name} parse (auto)`, () => {
    test("returns null for invalid input", () => {
      expect(parse("invalid")).toBeNull();
      expect(parse("")).toBeNull();
      expect(parse("!@#$%")).toBeNull();
    });

    const examples = validator.examples ?? [];
    if (examples.length > 0) {
      test("returns ParsedPersonId for valid examples", () => {
        for (const example of examples) {
          const result = parse(example);
          expect(result).not.toBeNull();
          expect(result!.birthDate).toBeInstanceOf(Date);
          if ("gender" in result!) {
            expect(
              result!.gender === "male" ||
                result!.gender === "female",
            ).toBe(true);
          }
        }
      });
    }
  });
}

// ─── Specific date/gender assertions ────────────

describe("cz.rc parse", () => {
  const mod = discovered.find((m) => m.name === "cz.rc");
  if (!mod) throw new Error("cz.rc not discovered");
  const { parse } = mod;

  test("extracts male born 1971-03-19", () => {
    const result = parse("7103192745");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1971);
    expect(result!.birthDate.getMonth()).toBe(2);
    expect(result!.birthDate.getDate()).toBe(19);
  });

  test("extracts female (month + 50)", () => {
    const result = parse("715319/1001");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("female");
    expect(result!.birthDate.getMonth()).toBe(2);
  });

  test("returns null for checksum mismatch", () => {
    expect(parse("7103192746")).toBeNull();
  });
});

describe("sk.rc parse", () => {
  const mod = discovered.find((m) => m.name === "sk.rc");
  if (!mod) throw new Error("sk.rc not discovered");
  const { parse } = mod;

  test("delegates to cz.rc parse", () => {
    const result = parse("7103192745");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1971);
  });
});

describe("bg.egn parse", () => {
  const mod = discovered.find((m) => m.name === "bg.egn");
  if (!mod) throw new Error("bg.egn not discovered");
  const { parse } = mod;

  test("extracts date and gender", () => {
    const result = parse("7523169263");
    expect(result).not.toBeNull();
    expect(result!.birthDate.getFullYear()).toBe(1875);
    expect(result!.birthDate.getMonth()).toBe(2);
    expect(result!.birthDate.getDate()).toBe(16);
  });

  test("returns null for checksum mismatch", () => {
    expect(parse("7523169264")).toBeNull();
  });
});

describe("dk.cpr parse", () => {
  const mod = discovered.find((m) => m.name === "dk.cpr");
  if (!mod) throw new Error("dk.cpr not discovered");
  const { parse } = mod;

  test("extracts male born 1862-10-21", () => {
    const result = parse("2110625629");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1862);
    expect(result!.birthDate.getMonth()).toBe(9);
    expect(result!.birthDate.getDate()).toBe(21);
  });
});

describe("ee.ik parse", () => {
  const mod = discovered.find((m) => m.name === "ee.ik");
  if (!mod) throw new Error("ee.ik not discovered");
  const { parse } = mod;

  test("extracts male born 1968-05-28", () => {
    const result = parse("36805280109");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1968);
    expect(result!.birthDate.getMonth()).toBe(4);
    expect(result!.birthDate.getDate()).toBe(28);
  });
});

describe("fi.hetu parse", () => {
  const mod = discovered.find((m) => m.name === "fi.hetu");
  if (!mod) throw new Error("fi.hetu not discovered");
  const { parse } = mod;

  test("extracts female born 1952-10-13", () => {
    const result = parse("131052-308T");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("female");
    expect(result!.birthDate.getFullYear()).toBe(1952);
    expect(result!.birthDate.getMonth()).toBe(9);
    expect(result!.birthDate.getDate()).toBe(13);
  });
});

describe("it.codicefiscale parse", () => {
  const mod = discovered.find(
    (m) => m.name === "it.codicefiscale",
  );
  if (!mod) throw new Error("it.codicefiscale not discovered");
  const { parse } = mod;

  test("extracts male born 1983-11-18", () => {
    const result = parse("RCCMNL83S18D969H");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1983);
    expect(result!.birthDate.getMonth()).toBe(10);
    expect(result!.birthDate.getDate()).toBe(18);
  });

  test("returns null for 11-digit IVA", () => {
    expect(parse("00743110157")).toBeNull();
  });
});

describe("no.fodselsnummer parse", () => {
  const mod = discovered.find(
    (m) => m.name === "no.fodselsnummer",
  );
  if (!mod)
    throw new Error("no.fodselsnummer not discovered");
  const { parse } = mod;

  test("extracts female born 1986-10-15", () => {
    const result = parse("15108695088");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("female");
    expect(result!.birthDate.getFullYear()).toBe(1986);
    expect(result!.birthDate.getMonth()).toBe(9);
    expect(result!.birthDate.getDate()).toBe(15);
  });
});

describe("pl.pesel parse", () => {
  const mod = discovered.find(
    (m) => m.name === "pl.pesel",
  );
  if (!mod) throw new Error("pl.pesel not discovered");
  const { parse } = mod;

  test("extracts male born 1944-05-14", () => {
    const result = parse("44051401359");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1944);
    expect(result!.birthDate.getMonth()).toBe(4);
    expect(result!.birthDate.getDate()).toBe(14);
  });

  test("extracts 1900s date from month <= 12", () => {
    const result = parse("02070803628");
    expect(result).not.toBeNull();
    expect(result!.birthDate.getFullYear()).toBe(1902);
    expect(result!.birthDate.getMonth()).toBe(6);
  });

  test("returns null for checksum mismatch", () => {
    expect(parse("44051401358")).toBeNull();
  });
});

describe("ro.cnp parse", () => {
  const mod = discovered.find((m) => m.name === "ro.cnp");
  if (!mod) throw new Error("ro.cnp not discovered");
  const { parse } = mod;

  test("extracts male born 1963-06-15", () => {
    const result = parse("1630615123457");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1963);
    expect(result!.birthDate.getMonth()).toBe(5);
    expect(result!.birthDate.getDate()).toBe(15);
  });
});

describe("se.personnummer parse", () => {
  const mod = discovered.find(
    (m) => m.name === "se.personnummer",
  );
  if (!mod)
    throw new Error("se.personnummer not discovered");
  const { parse } = mod;

  test("extracts from valid personnummer", () => {
    const result = parse("8803200016");
    expect(result).not.toBeNull();
    expect(result!.birthDate.getFullYear()).toBe(1988);
    expect(result!.birthDate.getMonth()).toBe(2);
    expect(result!.birthDate.getDate()).toBe(20);
    expect(result!.gender).toBe("male");
  });
});

describe("si.emso parse", () => {
  const mod = discovered.find(
    (m) => m.name === "si.emso",
  );
  if (!mod) throw new Error("si.emso not discovered");
  const { parse } = mod;

  test("extracts male born 2006-01-01", () => {
    const result = parse("0101006500006");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(2006);
    expect(result!.birthDate.getMonth()).toBe(0);
    expect(result!.birthDate.getDate()).toBe(1);
  });
});

describe("fr.nir parse", () => {
  const mod = discovered.find(
    (m) => m.name === "fr.nir",
  );
  if (!mod) throw new Error("fr.nir not discovered");
  const { parse } = mod;

  test("extracts female born 1995-11-01", () => {
    const result = parse("295117823456784");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("female");
    expect(result!.birthDate.getFullYear()).toBe(1995);
    expect(result!.birthDate.getMonth()).toBe(10);
    expect(result!.birthDate.getDate()).toBe(1);
  });

  test("extracts male", () => {
    const base = 1850578123456n;
    const check = 97n - (base % 97n);
    const full =
      base.toString() +
      check.toString().padStart(2, "0");
    const result = parse(full);
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1985);
    expect(result!.birthDate.getMonth()).toBe(4);
  });

  test("returns null for invalid input", () => {
    expect(parse("invalid")).toBeNull();
  });
});
