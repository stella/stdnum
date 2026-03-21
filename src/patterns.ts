/**
 * Derive candidate-matching regex patterns from
 * validators. These patterns find CANDIDATES in
 * text — use `validate()` to confirm each match.
 *
 * Designed for integration with regex-set or
 * similar multi-pattern scanning engines.
 *
 * @example
 * ```ts
 * import {
 *   toRegex, byCountry, byEntityType,
 * } from "@stll/stdnum/patterns";
 * import { cz } from "@stll/stdnum";
 *
 * // Single validator
 * toRegex(cz.ico);
 * // → /\b\d{8}\b/g
 *
 * // All Czech validators
 * byCountry("CZ");
 * // → [{ validator: cz.ico, regex }, ...]
 *
 * // All company identifiers
 * byEntityType("company");
 * // → [{ validator, regex }, ...]
 * ```
 */

import type {
  CountryCode,
  Validator,
} from "./types";

// ─── Pattern type ─────────────────────────────

export type ValidatorPattern = {
  /** The validator this pattern was derived from. */
  validator: Validator;
  /** Loose regex matching candidates in text. */
  regex: RegExp;
};

// ─── Regex derivation ─────────────────────────

/** Separator chars that compact() strips. */
const SEP = "[\\s\\-./]?";

/**
 * Infer compact lengths from metadata or examples.
 */
const inferLengths = (v: Validator): number[] => {
  if (v.lengths && v.lengths.length > 0) {
    return [...v.lengths];
  }
  if (v.examples && v.examples.length > 0) {
    const lens = new Set<number>();
    for (const ex of v.examples) {
      lens.add(v.compact(ex).length);
    }
    return [...lens];
  }
  return [];
};

/**
 * Derive the display grouping from format().
 * Returns an array of group sizes, e.g.,
 * "25 123 891" → [2, 3, 3].
 */
const inferGroups = (
  v: Validator,
): number[] | null => {
  if (!v.examples || v.examples.length === 0) {
    return null;
  }
  const compact = v.compact(v.examples[0]!);
  const formatted = v.format(compact);
  if (formatted === compact) return null;

  // Split on non-alphanumeric separators
  const parts = formatted.split(/[^a-zA-Z0-9]+/);
  if (parts.length <= 1) return null;

  const groups = parts
    .filter((p) => p.length > 0)
    .map((p) => p.length);

  return groups.length > 1 ? groups : null;
};

/**
 * Detect if this validator uses a known prefix
 * (e.g., "CZ" for DIČ, "CHE" for Swiss UID).
 */
const inferPrefix = (
  v: Validator,
): string | null => {
  if (!v.examples || v.examples.length === 0) {
    return null;
  }
  const compact = v.compact(v.examples[0]!);
  // Check if compact form starts with letters
  const match = compact.match(/^([A-Z]+)\d/);
  return match ? match[1]! : null;
};

/**
 * Build a digit-group regex from group sizes.
 * [2, 3, 3] → /\d{2}[\s\-.]?\d{3}[\s\-.]?\d{3}/
 */
const groupsToPattern = (
  groups: number[],
): string =>
  groups.map((g) => `\\d{${g}}`).join(SEP);

/**
 * Derive a loose candidate-matching regex from
 * a validator. The regex finds potential matches;
 * use `validate()` to confirm.
 *
 * Strategy:
 * 1. If format() reveals grouping, use that
 *    (e.g., XX.XXX.XXX → /\d{2}\.?\d{3}\.?\d{3}/)
 * 2. Otherwise, match digit sequences of the
 *    right compact length
 * 3. If a prefix is detected, prepend it
 */
export const toRegex = (v: Validator): RegExp => {
  const prefix = inferPrefix(v);
  const groups = inferGroups(v);
  const lengths = inferLengths(v);

  let pattern: string;

  if (groups) {
    // Use display grouping for precise matching
    pattern = groupsToPattern(groups);
  } else if (lengths.length === 1) {
    pattern = `\\d{${lengths[0]}}`;
  } else if (lengths.length > 1) {
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    pattern = `\\d{${min},${max}}`;
  } else {
    // Fallback: 6-20 digit sequence
    pattern = `\\d{6,20}`;
  }

  if (prefix) {
    pattern = `${prefix}${SEP}${pattern}`;
  }

  // Word boundary to avoid matching inside
  // larger numbers
  return new RegExp(`(?<!\\w)${pattern}(?!\\w)`, "g");
};

// ─── Grouped collections ──────────────────────

/**
 * All discovered validators, lazily populated.
 * Import * from "../src" would pull everything;
 * instead, callers pass validators explicitly.
 */

/**
 * Build patterns for a list of validators.
 */
export const toPatterns = (
  validators: readonly Validator[],
): ValidatorPattern[] =>
  validators.map((v) => ({
    validator: v,
    regex: toRegex(v),
  }));

/**
 * Filter validators by country code and build
 * patterns.
 */
export const byCountry = (
  country: CountryCode,
  validators: readonly Validator[],
): ValidatorPattern[] =>
  toPatterns(
    validators.filter((v) => v.country === country),
  );

/**
 * Filter validators by entity type and build
 * patterns.
 */
export const byEntityType = (
  entityType: "person" | "company" | "any",
  validators: readonly Validator[],
): ValidatorPattern[] =>
  toPatterns(
    validators.filter(
      (v) =>
        v.entityType === entityType ||
        v.entityType === "any",
    ),
  );

/**
 * Build patterns for ALL provided validators.
 */
export const allPatterns = (
  validators: readonly Validator[],
): ValidatorPattern[] => toPatterns(validators);
