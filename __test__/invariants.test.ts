/**
 * Structural invariant tests for every validator.
 *
 * Auto-discovers all validators and checks metadata
 * consistency: examples exist, examples validate,
 * compact is idempotent, entityType is valid,
 * required fields are non-empty, scope matches the
 * export namespace, and example lengths match the
 * declared `lengths` array.
 *
 * New validators get all checks automatically when
 * added to the index.
 */

import { describe, expect, test } from "bun:test";

import * as all from "../src";
import type { Validator } from "../src/types";

// ─── Auto-discover every Validator ──────────

const isRecord = (
  value: unknown,
): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isValidator = (value: unknown): value is Validator =>
  isRecord(value) &&
  "validate" in value &&
  "compact" in value &&
  "format" in value;

const validators: Array<[string, Validator]> = [];

for (const [ns, mod] of Object.entries(all)) {
  const moduleValue: unknown = mod;
  if (isValidator(moduleValue)) {
    validators.push([ns, moduleValue]);
    continue;
  }
  if (!isRecord(moduleValue)) continue;

  for (const [key, value] of Object.entries(moduleValue)) {
    if (isValidator(value)) {
      validators.push([`${ns}.${key}`, value]);
    }
  }
}

/**
 * International validators live at the top level
 * (no country directory) or under `eu/`. They must
 * NOT have a `country` field.
 */
const INTERNATIONAL_NAMESPACES = new Set([
  "bic",
  "creditcard",
  "iban",
  "isin",
  "lei",
  "luhn",
  "eu",
  "crypto",
]);

const VALID_ENTITY_TYPES = new Set([
  "person",
  "company",
  "any",
]);

// ─── Invariant tests ────────────────────────

for (const [name, v] of validators) {
  describe(`invariants: ${name}`, () => {
    // (a) Every validator has >= 1 example
    test("has at least one example", () => {
      expect(
        v.examples?.length,
        `${name} is missing examples`,
      ).toBeGreaterThan(0);
    });

    // (b) Example lengths match `lengths` field
    if (v.lengths !== undefined && v.examples) {
      test("example lengths match lengths field", () => {
        for (const example of v.examples!) {
          const compacted = v.compact(example);
          expect(
            v.lengths,
            `${name}: compact("${example}") has length ${compacted.length} which is not in lengths [${v.lengths!.join(", ")}]`,
          ).toContain(compacted.length);
        }
      });
    }

    // (c) Scope matches export namespace
    test("scope matches export namespace", () => {
      const ns = name.split(".")[0]!;
      if (INTERNATIONAL_NAMESPACES.has(ns)) {
        expect(
          v.scope,
          `${name}: expected global scope but got "${v.scope}"`,
        ).toBe("global");
        expect(
          "country" in v,
          `${name} is global but has a country field`,
        ).toBe(false);
        return;
      }

      if (v.scope !== "country") {
        throw new Error(
          `${name}: expected country scope but got "${v.scope}"`,
        );
      }

      // Namespace `is_` maps to country "IS"
      const expected = ns.replace(/_$/, "").toUpperCase();
      expect(
        v.country,
        `${name}: expected country "${expected}" but got "${v.country}"`,
      ).toBe(expected);
    });

    // (d) Examples validate successfully
    if (v.examples) {
      test("all examples validate successfully", () => {
        for (const example of v.examples!) {
          const result = v.validate(example);
          expect(
            result.valid,
            `${name}: example "${example}" failed validation: ${
              !result.valid ? result.error.message : ""
            }`,
          ).toBe(true);
        }
      });
    }

    // (e) Compact is idempotent
    if (v.examples) {
      test("compact is idempotent", () => {
        for (const example of v.examples!) {
          const once = v.compact(example);
          const twice = v.compact(once);
          expect(
            twice,
            `${name}: compact is not idempotent for "${example}" (${once} !== ${twice})`,
          ).toBe(once);
        }
      });
    }

    // (f) entityType is valid
    test("entityType is valid", () => {
      expect(
        VALID_ENTITY_TYPES.has(v.entityType),
        `${name}: entityType "${v.entityType}" is not "person", "company", or "any"`,
      ).toBe(true);
    });

    // (g) Required string fields are non-empty
    test("name is a non-empty string", () => {
      expect(typeof v.name).toBe("string");
      expect(
        v.name.length,
        `${name}: name is empty`,
      ).toBeGreaterThan(0);
    });

    test("localName is a non-empty string", () => {
      expect(typeof v.localName).toBe("string");
      expect(
        v.localName.length,
        `${name}: localName is empty`,
      ).toBeGreaterThan(0);
    });

    test("abbreviation is a non-empty string", () => {
      expect(typeof v.abbreviation).toBe("string");
      expect(
        v.abbreviation.length,
        `${name}: abbreviation is empty`,
      ).toBeGreaterThan(0);
    });
  });
}
