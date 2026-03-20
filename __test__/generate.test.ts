/**
 * Auto-discovered generate() roundtrip tests.
 *
 * For every validator that defines `generate`,
 * verify that `validate(generate()).valid === true`
 * over 100 iterations.
 *
 * New validators with `generate` get tests
 * automatically when added — zero manual wiring.
 */

import { describe, expect, test } from "bun:test";

import * as all from "../src";
import type { Validator } from "../src/types";

// ─── Auto-discover validators with generate ────

type GeneratorEntry = {
  name: string;
  validator: Validator;
};

const generators: GeneratorEntry[] = [];

for (const [ns, mod] of Object.entries(all)) {
  if (
    mod &&
    typeof mod === "object" &&
    "validate" in mod &&
    "generate" in mod &&
    typeof (mod as Validator).generate === "function"
  ) {
    // Top-level validator (iban, luhn, creditcard, etc.)
    generators.push({
      name: ns,
      validator: mod as Validator,
    });
  } else if (mod && typeof mod === "object") {
    // Namespace (cz, de, etc.)
    for (const [key, v] of Object.entries(
      mod as Record<string, unknown>,
    )) {
      if (
        v &&
        typeof v === "object" &&
        "validate" in v &&
        "generate" in v &&
        typeof (v as Validator).generate === "function"
      ) {
        generators.push({
          name: `${ns}.${key}`,
          validator: v as Validator,
        });
      }
    }
  }
}

// ─── Constants ──────────────────────────────────

const ITERATIONS = 100;

// ─── Roundtrip tests ────────────────────────────

for (const { name, validator } of generators) {
  describe(`${name}.generate()`, () => {
    test(`produces valid values (${String(ITERATIONS)}x)`, () => {
      for (let i = 0; i < ITERATIONS; i++) {
        const value = validator.generate!();
        const result = validator.validate(value);
        if (!result.valid) {
          expect(
            `${name}.generate() => "${value}" failed`,
          ).toBe("valid");
        }
        expect(result.valid).toBe(true);
      }
    });

    test("returns a compact string", () => {
      const value = validator.generate!();
      expect(value).not.toContain(" ");
      expect(value).not.toContain("-");
      expect(value).not.toContain("/");
    });
  });
}

// ─── Specific generator tests ───────────────────

describe("creditcard.generate() specifics", () => {
  const entry = generators.find(
    (g) => g.name === "creditcard",
  );
  if (!entry)
    throw new Error("creditcard generator not discovered");

  test("produces 16-digit Visa or Mastercard", () => {
    for (let i = 0; i < 50; i++) {
      const value = entry.validator.generate!();
      expect(value.length).toBe(16);
      const first = value[0];
      expect(first === "4" || first === "5").toBe(true);
    }
  });
});

describe("iban.generate() specifics", () => {
  const entry = generators.find(
    (g) => g.name === "iban",
  );
  if (!entry)
    throw new Error("iban generator not discovered");

  test("produces CZ, DE, or SK IBAN", () => {
    const countries = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const value = entry.validator.generate!();
      const cc = value.slice(0, 2);
      expect(["CZ", "DE", "SK"]).toContain(cc);
      countries.add(cc);
    }
    expect(countries.size).toBeGreaterThanOrEqual(2);
  });
});

describe("luhn.generate() specifics", () => {
  const entry = generators.find(
    (g) => g.name === "luhn",
  );
  if (!entry)
    throw new Error("luhn generator not discovered");

  test("produces 16-digit number by default", () => {
    const value = entry.validator.generate!();
    expect(value.length).toBe(16);
  });
});
