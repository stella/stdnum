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
 * // → /(?<!\w)\d{8}(?!\w)/g
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

import type { CountryCode, Validator } from "./types";

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
const inferGroups = (v: Validator): number[] | null => {
  if (!v.examples || v.examples.length === 0) {
    return null;
  }
  const compact = v.compact(v.examples[0]!);
  const formatted = v.format(compact);
  if (formatted === compact) return null;

  // Split on non-alphanumeric separators
  const parts = formatted.split(/[^a-zA-Z0-9]+/);
  if (parts.length <= 1) return null;

  // For digit-only validators, skip letter-only
  // tokens (prefix like "CHE"). For alphanumeric
  // validators (IBAN, ISIN), keep all groups.
  const isAlphanumeric = parts.some(
    (p) => /[a-zA-Z]/.test(p) && /\d/.test(p),
  );
  const groups = parts
    .filter(
      (p) =>
        p.length > 0 && (isAlphanumeric || /\d/.test(p)),
    )
    .map((p) => p.length);

  return groups.length > 1 ? groups : null;
};

/**
 * Detect if this validator uses a known prefix
 * (e.g., "CZ" for DIČ, "CHE" for Swiss UID).
 */
const inferPrefix = (v: Validator): string | null => {
  if (!v.examples || v.examples.length === 0) {
    return null;
  }
  const compact = v.compact(v.examples[0]!);
  // Prefix already present in compact form.
  // But only if ALL examples share the same prefix
  // (e.g., "CHE" for Swiss UID). If examples have
  // different prefixes (IBAN: GB/DE/FR), there's
  // no fixed prefix — it's part of the value.
  const compactMatch = compact.match(/^([A-Z]+)\d/);
  if (compactMatch && v.examples!.length > 1) {
    const pfx = compactMatch[1]!;
    const allSame = v.examples!.every((ex) =>
      v.compact(ex).startsWith(pfx),
    );
    if (allSame) return pfx;
  } else if (compactMatch && v.examples!.length === 1) {
    return compactMatch[1]!;
  }
  // Prefix added only by format()
  // (e.g., "DE" for de.vat, "CZ" for cz.dic)
  const formatted = v.format(compact);
  const fmtMatch = formatted.match(/^([A-Z]+)[\s\-./]?\d/);
  if (fmtMatch && !compact.startsWith(fmtMatch[1]!)) {
    return fmtMatch[1]!;
  }
  return null;
};

/**
 * Character class for a string fragment:
 * `\d` if all digits, `[A-Z]` if all letters,
 * `[A-Z0-9]` if mixed.
 */
const charClassFor = (s: string): string => {
  let hasLetter = false;
  let hasDigit = false;
  for (const ch of s) {
    if (/[a-zA-Z]/.test(ch)) hasLetter = true;
    if (/\d/.test(ch)) hasDigit = true;
  }
  if (hasLetter && hasDigit) return "[A-Z0-9]";
  if (hasLetter) return "[A-Z]";
  return "\\d";
};

/**
 * Determine the character class needed for the
 * compact form: `\d` if all digits, `[A-Z0-9]`
 * if alphanumeric, etc.
 */
const inferCharClass = (v: Validator): string => {
  if (!v.examples || v.examples.length === 0) {
    return "\\d";
  }
  const combined = v.examples
    .map((ex) => v.compact(ex))
    .join("");
  return charClassFor(combined);
};

type PerGroupInfo = {
  sizes: number[];
  classes: string[];
};

/**
 * Infer per-group sizes AND character classes from
 * format(). Returns groups with per-position char
 * classes, e.g., "12 010188 M 01 1" →
 *   sizes: [2, 6, 1, 2, 1]
 *   classes: ["\d", "\d", "[A-Z]", "\d", "\d"]
 *
 * Only returns non-null when per-group classes
 * differ (some groups are letters, some digits).
 * Letter-only groups before the first digit group
 * are treated as prefixes and excluded (handled
 * by inferPrefix separately).
 */
const inferPerGroupInfo = (
  v: Validator,
): PerGroupInfo | null => {
  if (!v.examples || v.examples.length === 0) {
    return null;
  }
  const compact = v.compact(v.examples[0]!);
  const formatted = v.format(compact);
  if (formatted === compact) return null;

  // Only applies to mixed validators (compact has
  // both letters and digits in separate positions,
  // like German SVNR "12010188M011").
  const compactMixed =
    /[a-zA-Z]/.test(compact) && /\d/.test(compact);
  if (!compactMixed) return null;

  // Also skip if any single part mixes letters and
  // digits (IBAN, ISIN) — inferGroups already
  // handles those correctly with the global class.
  const parts = formatted.split(/[^a-zA-Z0-9]+/);
  const isAlphanumeric = parts.some(
    (p) => /[a-zA-Z]/.test(p) && /\d/.test(p),
  );
  if (isAlphanumeric) return null;

  // Keep digit groups and letter-only groups that
  // appear AFTER the first digit group (embedded
  // letters). Skip letter-only groups before the
  // first digit group (prefix like "CHE").
  const filtered: string[] = [];
  let seenDigitGroup = false;
  for (const p of parts) {
    if (p.length === 0) continue;
    if (/\d/.test(p)) {
      seenDigitGroup = true;
      filtered.push(p);
    } else if (seenDigitGroup) {
      filtered.push(p);
    }
  }

  if (filtered.length <= 1) return null;

  const classes = filtered.map(charClassFor);
  const allSame = classes.every((c) => c === classes[0]);
  if (allSame) return null;

  return {
    sizes: filtered.map((p) => p.length),
    classes,
  };
};

/**
 * Build a group regex from group sizes + char class.
 * [2, 3, 3] with \d → /\d{2}[\s\-.]?\d{3}[\s\-.]?\d{3}/
 */
const groupsToPattern = (
  groups: number[],
  cc: string,
): string => groups.map((g) => `${cc}{${g}}`).join(SEP);

/**
 * Build a group regex with per-group char classes.
 * Produces tighter patterns when groups have different
 * character types (e.g., digits vs letters).
 */
const groupsToPatternPerClass = (
  groups: number[],
  classes: string[],
): string =>
  groups.map((g, i) => `${classes[i]!}{${g}}`).join(SEP);

/**
 * Derive a loose candidate-matching regex from
 * a validator. The regex finds potential matches;
 * use `validate()` to confirm.
 *
 * Handles both digit-only (IČO, NIP) and
 * alphanumeric (IBAN, BIC, ISIN, LEI) validators.
 */
export const toRegex = (v: Validator): RegExp => {
  const prefix = inferPrefix(v);
  const groups = inferGroups(v);
  const lengths = inferLengths(v);
  const cc = inferCharClass(v);

  let pattern: string;

  // Use per-group char classes when groups mix
  // digits and letters (e.g., German SVNR:
  // "12 010188 M 01 1" → [\d, \d, [A-Z], \d, \d]).
  // This prevents overly broad [A-Z0-9] from
  // matching all-caps prose as identifiers.
  const perGroup = inferPerGroupInfo(v);

  if (perGroup && lengths.length <= 1) {
    pattern = groupsToPatternPerClass(
      perGroup.sizes,
      perGroup.classes,
    );
  } else if (groups && lengths.length <= 1) {
    pattern = groupsToPattern(groups, cc);
  } else if (lengths.length === 1) {
    pattern = `${cc}{${lengths[0]}}`;
  } else if (lengths.length > 1) {
    const min = Math.min(...lengths);
    const max = Math.max(...lengths);
    pattern = `${cc}{${min},${max}}`;
  } else {
    pattern = `${cc}{6,20}`;
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
        entityType === "any" ||
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
