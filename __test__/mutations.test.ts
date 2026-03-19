/**
 * Mutation testing for checksum validators.
 *
 * For every validator that uses a checksum, verify
 * that single-digit mutations of valid examples are
 * detected. This catches validators where tests
 * exist but don't actually exercise the checksum
 * logic.
 *
 * Auto-discovers all validators from the index —
 * no manual list needed. New validators with
 * examples get mutation coverage automatically.
 *
 * Detection logic for "has checksum": mutate one
 * example and check if ANY mutation returns
 * INVALID_CHECKSUM. If so, the validator has a
 * checksum. If all mutations return INVALID_FORMAT,
 * INVALID_COMPONENT, or valid:true, it's format-only.
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

// ─── Mutation helpers ───────────────────────

/**
 * Generate all single-digit mutations of a value.
 * For each digit position, replace with every other
 * digit (0-9). Non-digit characters are skipped.
 */
const mutate = (
  value: string,
): Array<{
  position: number;
  original: string;
  replacement: string;
  mutated: string;
}> => {
  const mutations: Array<{
    position: number;
    original: string;
    replacement: string;
    mutated: string;
  }> = [];

  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === undefined || ch < "0" || ch > "9") {
      continue;
    }
    for (let d = 0; d <= 9; d++) {
      const replacement = String(d);
      if (replacement === ch) continue;
      mutations.push({
        position: i,
        original: ch,
        replacement,
        mutated:
          value.slice(0, i) +
          replacement +
          value.slice(i + 1),
      });
    }
  }

  return mutations;
};

/**
 * Detect whether a validator uses a checksum by
 * mutating its examples and checking if any
 * mutation returns INVALID_CHECKSUM.
 */
const hasChecksum = (v: Validator): boolean => {
  if (!v.examples || v.examples.length === 0) {
    return false;
  }

  for (const example of v.examples) {
    const compacted = v.compact(example);
    const mutations = mutate(compacted);

    for (const m of mutations) {
      const result = v.validate(m.mutated);
      if (
        !result.valid &&
        result.error.code === "INVALID_CHECKSUM"
      ) {
        return true;
      }
    }
  }

  return false;
};

// ─── Mutation tests ─────────────────────────

for (const [name, v] of validators) {
  if (!v.examples || v.examples.length === 0) continue;
  if (!hasChecksum(v)) continue;

  describe(`mutations: ${name}`, () => {
    test("single-digit mutations are detected", () => {
      for (const example of v.examples!) {
        const compacted = v.compact(example);

        // Confirm the example itself is valid
        const baseline = v.validate(compacted);
        expect(baseline.valid).toBe(true);

        const mutations = mutate(compacted);
        if (mutations.length === 0) continue;

        // Count how many mutations are caught
        // (invalid) vs escape (still valid).
        // Some escapes are expected — checksum
        // algorithms have a finite detection rate.
        // But at least SOME mutations must fail.
        let caught = 0;
        let escaped = 0;

        for (const m of mutations) {
          const result = v.validate(m.mutated);
          if (result.valid) {
            escaped++;
          } else {
            caught++;
          }
        }

        // At least one mutation must be detected.
        // If zero are caught, the checksum logic
        // is not actually being exercised.
        expect(caught).toBeGreaterThan(0);

        // Escape rate should be well below 100%.
        // A checksum that catches nothing is broken.
        const total = caught + escaped;
        const escapeRate = escaped / total;
        expect(escapeRate).toBeLessThan(1);
      }
    });
  });
}
