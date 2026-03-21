/**
 * Find validated identifiers in free text.
 *
 * Two detection modes:
 * 1. **Candidate scan**: uses each validator's
 *    `candidatePattern` to find format matches,
 *    then confirms with `validate()`.
 * 2. **Alias scan**: searches for known aliases
 *    (trigger words), extracts nearby alphanumeric
 *    content, then confirms with `validate()`.
 *
 * Both modes return only checksum-verified matches,
 * eliminating false positives that regex alone
 * cannot filter.
 *
 * @example
 * ```ts
 * import { findInText } from "@stll/stdnum";
 * import * as it from "@stll/stdnum/it/mod";
 *
 * const hits = findInText(
 *   "codice fiscale: RSSMRA75C15H501W",
 *   { validators: [it.codicefiscale] },
 * );
 * // [{ start: 17, end: 33, text: "RSSMRA75C15H501W",
 * //    compact: "RSSMRA75C15H501W", validator: ... }]
 * ```
 */

import type { CountryCode, Validator } from "./types";

/** A validated identifier found in text. */
export type FoundIdentifier = {
  /** Start offset in the source text. */
  start: number;
  /** End offset in the source text. */
  end: number;
  /** Raw text as it appears in the document. */
  text: string;
  /** Normalized compact form. */
  compact: string;
  /** The validator that confirmed this match. */
  validator: Validator;
  /**
   * How the match was found:
   * - "candidate": matched by candidatePattern regex
   * - "alias": found via alias keyword + vicinity
   */
  mode: "candidate" | "alias";
};

export type FindOptions = {
  /**
   * Validators to search for. If omitted, the
   * caller must provide validators explicitly.
   */
  validators: readonly Validator[];
  /**
   * Filter to specific countries. If set, only
   * validators matching these countries (plus
   * international ones without a country) are used.
   */
  countries?: readonly CountryCode[];
};

/**
 * Characters to search after an alias keyword.
 * Covers "IČO: 12345678" and "IČO 12345678".
 */
const ALIAS_WINDOW = 40;

/**
 * Extract a value candidate from text after an
 * alias. Skips separator chars (colon, equals,
 * whitespace, number sign) then captures an
 * alphanumeric sequence with optional internal
 * separators (spaces, dots, hyphens, slashes).
 */
const VALUE_RE =
  /^[\s:=°º#]*([A-Z0-9][A-Z0-9\s.\-/]{2,})/i;

/**
 * Check if a character at position is a word char
 * (letter or digit). Used for word-boundary checks.
 */
const isWordChar = (
  text: string,
  pos: number,
): boolean => {
  if (pos < 0 || pos >= text.length) return false;
  const ch = text[pos];
  if (!ch) return false;
  return /[\p{L}\p{N}]/u.test(ch);
};

/**
 * Find all validated identifiers in text.
 *
 * Returns only matches confirmed by the validator's
 * `validate()` function (checksum, format, etc.).
 * Results are sorted by start position; overlapping
 * matches from different validators are all returned.
 */
export const findInText = (
  text: string,
  options: FindOptions,
): FoundIdentifier[] => {
  const results: FoundIdentifier[] = [];

  const validators = options.countries
    ? options.validators.filter(
        (v) =>
          !v.country ||
          (options.countries as readonly string[])
            .includes(v.country),
      )
    : options.validators;

  // Mode 1: Candidate pattern scan
  for (const v of validators) {
    if (!v.candidatePattern) continue;

    const re = new RegExp(v.candidatePattern, "g");
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const raw = match[0];
      const result = v.validate(raw);
      if (result.valid) {
        results.push({
          start: match.index,
          end: match.index + raw.length,
          text: raw,
          compact: result.compact,
          validator: v,
          mode: "candidate",
        });
      }
    }
  }

  // Mode 2: Alias scan
  const lowerText = text.toLowerCase();

  for (const v of validators) {
    if (!v.aliases || v.aliases.length === 0) continue;

    for (const alias of v.aliases) {
      if (alias.length < 2) continue;
      const lowerAlias = alias.toLowerCase();

      let from = 0;
      while (from < lowerText.length) {
        const idx = lowerText.indexOf(lowerAlias, from);
        if (idx === -1) break;

        // Word-boundary check
        if (isWordChar(text, idx - 1)) {
          from = idx + 1;
          continue;
        }
        const afterAlias = idx + lowerAlias.length;
        if (isWordChar(text, afterAlias) &&
            // Allow if next char is separator-like
            !/[\s:=.#(]/.test(text[afterAlias] ?? "")) {
          from = idx + 1;
          continue;
        }

        // Extract value from window after alias
        const window = text.slice(
          afterAlias,
          afterAlias + ALIAS_WINDOW,
        );
        const valueMatch = VALUE_RE.exec(window);

        if (valueMatch?.[1]) {
          const raw = valueMatch[1].trim();
          const result = v.validate(raw);

          if (result.valid) {
            const valueStart =
              afterAlias +
              (valueMatch.index ?? 0) +
              valueMatch[0].indexOf(raw);

            // Skip if this position already has a
            // candidate-mode match from the same
            // validator (candidate takes priority)
            const duplicate = results.some(
              (r) =>
                r.validator === v &&
                r.start === valueStart &&
                r.mode === "candidate",
            );

            if (!duplicate) {
              results.push({
                start: valueStart,
                end: valueStart + raw.length,
                text: raw,
                compact: result.compact,
                validator: v,
                mode: "alias",
              });
            }
          }
        }

        from = afterAlias;
      }
    }
  }

  // Sort by position, deduplicate overlaps
  results.sort((a, b) => a.start - b.start);
  return results;
};
