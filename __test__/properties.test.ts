/**
 * Auto-discovered property tests for every
 * validator in the library.
 *
 * Properties tested:
 * 1. Roundtrip: compact(format(compact(x))) === compact(x)
 * 2. Idempotency: validate(compact(x)).compact === compact(x)
 * 3. Compact idempotency: compact(compact(x)) === compact(x)
 * 4. Invalid input returns error, never throws
 *
 * New validators get all tests automatically when
 * added to the index — zero manual wiring.
 */

import { describe, expect, test } from "bun:test";
import fc from "fast-check";

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
    // Top-level validator (iban, luhn, lei, etc.)
    validators.push([ns, mod as Validator]);
  } else if (mod && typeof mod === "object") {
    // Namespace (cz, de, etc.)
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

// ─── Random string generator ────────────────

const randomStr = fc
  .array(
    fc.constantFrom(
      ..."0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz -/.+".split(
        "",
      ),
    ),
    { minLength: 1, maxLength: 25 },
  )
  .map((chars: string[]) => chars.join(""));

// ─── Garbage inputs for crash testing ───────

const GARBAGE = [
  "",
  " ",
  "null",
  "undefined",
  "0",
  "-1",
  "abc",
  "!@#$%^&*()",
  "🔥",
  "\x00\x00\x00",
  "9".repeat(100),
  "A".repeat(50),
  "12345",
  "AAAA",
  "00000000000000000000",
  "XX123456789",
];

// ─── Property tests ─────────────────────────

for (const [name, v] of validators) {
  describe(`properties: ${name}`, () => {
    // Use examples if available, otherwise try
    // random generation
    const seeds: string[] = v.examples
      ? [...v.examples]
      : [];

    // Also try to find valid values by random
    if (seeds.length < 3) {
      const randoms = fc.sample(randomStr, 500);
      for (const r of randoms) {
        if (seeds.length >= 5) break;
        const result = v.validate(r);
        if (result.valid) {
          seeds.push(result.compact);
        }
      }
    }

    if (seeds.length > 0) {
      test("roundtrip: compact(format(compact(x))) === compact(x)", () => {
        for (const seed of seeds) {
          const compacted = v.compact(seed);
          const formatted = v.format(compacted);
          const recompacted = v.compact(formatted);
          expect(recompacted).toBe(compacted);
        }
      });

      test("idempotent: validate(compact(x)).compact === compact(x)", () => {
        for (const seed of seeds) {
          const compacted = v.compact(seed);
          const result = v.validate(compacted);
          // Examples must be valid — if not, the
          // example itself is wrong
          expect(result.valid).toBe(true);
          if (result.valid) {
            expect(result.compact).toBe(compacted);
          }
        }
      });

      test("compact is idempotent: compact(compact(x)) === compact(x)", () => {
        for (const seed of seeds) {
          const once = v.compact(seed);
          const twice = v.compact(once);
          expect(twice).toBe(once);
        }
      });
    } else {
      test.skip("no valid seeds found", () => {});
    }

    test("invalid input returns error, never throws", () => {
      for (const garbage of GARBAGE) {
        const result = v.validate(garbage);
        // Must return a result, not throw
        expect(typeof result.valid).toBe("boolean");
        if (!result.valid) {
          expect(result.error.code).toBeDefined();
          expect(result.error.message).toBeDefined();
        }
      }
    });
  });
}
