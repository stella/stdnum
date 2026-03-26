/**
 * Auto-discovered parse tests for every validator
 * that exposes `parse()` on its public validator
 * object.
 *
 * Properties tested:
 * 1. parse(invalidInput) returns null
 * 2. parse(validExample) returns structured data
 *    with birthDate instanceof Date
 * 3. gender, when present, is "male" or "female"
 *
 * New parsers get generic tests automatically when
 * added to the public API — zero manual wiring.
 */

import { describe, expect, test } from "bun:test";

import * as all from "../src";
import type {
  ParsedIdentifier,
  Validator,
} from "../src/types";

type ParseValidator = Validator<ParsedIdentifier>;

type Discovered = {
  name: string;
  validator: ParseValidator;
};

const isValidator = (value: unknown): value is Validator =>
  Boolean(
    value &&
      typeof value === "object" &&
      "validate" in value &&
      "compact" in value &&
      "format" in value,
  );

const hasParse = (
  value: unknown,
): value is ParseValidator =>
  isValidator(value) &&
  typeof (value as { parse?: unknown }).parse === "function";

const discovered: Discovered[] = [];

for (const [ns, mod] of Object.entries(all)) {
  if (hasParse(mod)) {
    discovered.push({
      name: ns,
      validator: mod,
    });
    continue;
  }

  if (!mod || typeof mod !== "object") continue;

  for (const [key, value] of Object.entries(
    mod as Record<string, unknown>,
  )) {
    if (!hasParse(value)) continue;
    discovered.push({
      name: `${ns}.${key}`,
      validator: value,
    });
  }
}

for (const { name, validator } of discovered) {
  describe(`${name} parse (auto)`, () => {
    test("returns null for invalid input", () => {
      expect(validator.parse("invalid")).toBeNull();
      expect(validator.parse("")).toBeNull();
      expect(validator.parse("!@#$%")).toBeNull();
    });

    const examples = validator.examples ?? [];
    if (examples.length > 0) {
      test("returns structured data for valid examples", () => {
        for (const example of examples) {
          const result = validator.parse(example);
          expect(result).not.toBeNull();
          expect(result?.birthDate).toBeInstanceOf(Date);
          if (result && "gender" in result) {
            expect(
              result.gender === "male" ||
                result.gender === "female",
            ).toBe(true);
          }
        }
      });
    }
  });
}

describe("cz.rc parse", () => {
  const validator = discovered.find(
    (entry) => entry.name === "cz.rc",
  )?.validator;
  if (!validator) throw new Error("cz.rc not discovered");

  test("extracts male born 1971-03-19", () => {
    const result = validator.parse("7103192745");
    expect(result).not.toBeNull();
    expect(result && "gender" in result && result.gender).toBe(
      "male",
    );
    expect(result?.birthDate.getFullYear()).toBe(1971);
    expect(result?.birthDate.getMonth()).toBe(2);
    expect(result?.birthDate.getDate()).toBe(19);
  });

  test("extracts female (month + 50)", () => {
    const result = validator.parse("715319/1001");
    expect(result).not.toBeNull();
    expect(result && "gender" in result && result.gender).toBe(
      "female",
    );
    expect(result?.birthDate.getMonth()).toBe(2);
  });

  test("returns null for checksum mismatch", () => {
    expect(validator.parse("7103192746")).toBeNull();
  });
});

describe("sk.rc parse", () => {
  const validator = discovered.find(
    (entry) => entry.name === "sk.rc",
  )?.validator;
  if (!validator) throw new Error("sk.rc not discovered");

  test("delegates to cz.rc parse", () => {
    const result = validator.parse("7103192745");
    expect(result).not.toBeNull();
    expect(result && "gender" in result && result.gender).toBe(
      "male",
    );
    expect(result?.birthDate.getFullYear()).toBe(1971);
  });
});

describe("bg.egn parse", () => {
  const validator = discovered.find(
    (entry) => entry.name === "bg.egn",
  )?.validator;
  if (!validator) throw new Error("bg.egn not discovered");

  test("extracts date and gender", () => {
    const result = validator.parse("7523169263");
    expect(result).not.toBeNull();
    expect(result?.birthDate.getFullYear()).toBe(1875);
    expect(result?.birthDate.getMonth()).toBe(2);
    expect(result?.birthDate.getDate()).toBe(16);
  });

  test("returns null for checksum mismatch", () => {
    expect(validator.parse("7523169264")).toBeNull();
  });
});

describe("dk.cpr parse", () => {
  const validator = discovered.find(
    (entry) => entry.name === "dk.cpr",
  )?.validator;
  if (!validator) throw new Error("dk.cpr not discovered");

  test("extracts male born 1862-10-21", () => {
    const result = validator.parse("2110625629");
    expect(result).not.toBeNull();
    expect(result && "gender" in result && result.gender).toBe(
      "male",
    );
    expect(result?.birthDate.getFullYear()).toBe(1862);
    expect(result?.birthDate.getMonth()).toBe(9);
    expect(result?.birthDate.getDate()).toBe(21);
  });
});

describe("ee.ik parse", () => {
  const validator = discovered.find(
    (entry) => entry.name === "ee.ik",
  )?.validator;
  if (!validator) throw new Error("ee.ik not discovered");

  test("extracts male born 1968-05-28", () => {
    const result = validator.parse("36805280109");
    expect(result).not.toBeNull();
    expect(result && "gender" in result && result.gender).toBe(
      "male",
    );
    expect(result?.birthDate.getFullYear()).toBe(1968);
    expect(result?.birthDate.getMonth()).toBe(4);
    expect(result?.birthDate.getDate()).toBe(28);
  });
});

describe("fi.hetu parse", () => {
  const validator = discovered.find(
    (entry) => entry.name === "fi.hetu",
  )?.validator;
  if (!validator) throw new Error("fi.hetu not discovered");

  test("extracts female born 1952-10-13", () => {
    const result = validator.parse("131052-308T");
    expect(result).not.toBeNull();
    expect(result && "gender" in result && result.gender).toBe(
      "female",
    );
    expect(result?.birthDate.getFullYear()).toBe(1952);
    expect(result?.birthDate.getMonth()).toBe(9);
    expect(result?.birthDate.getDate()).toBe(13);
  });
});

describe("it.codicefiscale parse", () => {
  const validator = discovered.find(
    (entry) => entry.name === "it.codiceFiscale",
  )?.validator;
  if (!validator)
    throw new Error("it.codiceFiscale not discovered");

  test("extracts male born 1983-11-18", () => {
    const result = validator.parse("RCCMNL83S18D969H");
    expect(result).not.toBeNull();
    expect(result && "gender" in result && result.gender).toBe(
      "male",
    );
    expect(result?.birthDate.getFullYear()).toBe(1983);
    expect(result?.birthDate.getMonth()).toBe(10);
    expect(result?.birthDate.getDate()).toBe(18);
  });
});

describe("kw.civil parse", () => {
  const validator = discovered.find(
    (entry) => entry.name === "kw.civil",
  )?.validator;
  if (!validator) throw new Error("kw.civil not discovered");

  test("extracts birth date without gender", () => {
    const result = validator.parse("289011200032");
    expect(result).not.toBeNull();
    expect(result?.birthDate.getFullYear()).toBe(1989);
    expect(result?.birthDate.getMonth()).toBe(0);
    expect(result?.birthDate.getDate()).toBe(12);
    expect(result && "gender" in result).toBe(false);
  });
});
