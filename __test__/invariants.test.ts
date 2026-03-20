/**
 * Structural invariant tests for every validator.
 *
 * Auto-discovers all validators and checks metadata
 * consistency: examples exist, examples validate,
 * compact is idempotent, entityType is valid,
 * required fields are non-empty, directory name
 * matches country field, and example lengths match
 * the declared `lengths` array.
 *
 * New validators get all checks automatically when
 * added to the index.
 */

import { describe, expect, test } from "bun:test";

import * as all from "../src";
import type { Validator } from "../src/types";

// ─── Auto-discover every Validator ──────────

const validators: Array<[string, Validator]> = [];

for (const [ns, mod] of Object.entries(all)) {
  if (
    mod &&
    typeof mod === "object" &&
    "validate" in mod &&
    "compact" in mod &&
    "format" in mod
  ) {
    validators.push([ns, mod as Validator]);
  } else if (mod && typeof mod === "object") {
    for (const [key, v] of Object.entries(
      mod as Record<string, unknown>,
    )) {
      if (
        v &&
        typeof v === "object" &&
        "validate" in v &&
        "compact" in v &&
        "format" in v
      ) {
        validators.push([`${ns}.${key}`, v as Validator]);
      }
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

    // (c) Directory name matches country field
    test("directory name matches country field", () => {
      const ns = name.split(".")[0]!;
      if (INTERNATIONAL_NAMESPACES.has(ns)) {
        expect(
          v.country,
          `${name} is international but has country "${v.country}"`,
        ).toBeUndefined();
      } else {
        // Namespace `is_` maps to country "IS"
        const expected = ns
          .replace(/_$/, "")
          .toUpperCase();
        expect(
          v.country,
          `${name}: expected country "${expected}" but got "${v.country}"`,
        ).toBe(expected);
      }
    });

    // (d) Examples validate successfully
    if (v.examples) {
      test("all examples validate successfully", () => {
        for (const example of v.examples!) {
          const result = v.validate(example);
          expect(
            result.valid,
            `${name}: example "${example}" failed validation: ${
              !result.valid
                ? result.error.message
                : ""
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
