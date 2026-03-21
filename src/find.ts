/**
 * Find identifiers in unstructured text.
 *
 * Given a list of validators, scans the text for
 * candidate substrings and validates each one.
 * Returns matches with byte positions.
 *
 * @example
 * ```ts
 * import { find } from "@stll/stdnum/find";
 * import { cz, de } from "@stll/stdnum";
 *
 * const matches = find(
 *   "Company IČO 12345678 and VAT DE123456789",
 *   [cz.ico, de.vat],
 * );
 * // [
 * //   { validator: cz.ico, start: 12, end: 20,
 * //     compact: "12345678" },
 * //   { validator: de.vat, start: 29, end: 40,
 * //     compact: "123456789" },
 * // ]
 * ```
 */

import type { Validator } from "./types";

/** A match found in text. */
export type FindMatch = {
  /** The validator that matched. */
  validator: Validator;
  /** Start offset in the original text (chars). */
  start: number;
  /** End offset in the original text (chars). */
  end: number;
  /** The compact form of the matched value. */
  compact: string;
};

/**
 * Infer valid compact lengths for a validator
 * from its `lengths` field or `examples`.
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
 * Maximum number of separator characters (spaces,
 * dashes, dots, slashes) that `compact()` might
 * strip from a formatted identifier.
 */
const MAX_SEPARATOR_OVERHEAD = 8;

/**
 * Find all identifiers in `text` matching any of
 * the given `validators`.
 *
 * The algorithm:
 * 1. For each validator, determine valid compact
 *    lengths (from `lengths` or `examples`).
 * 2. Slide through the text, extracting candidate
 *    substrings at each position.
 * 3. For each candidate, run `compact()` then
 *    `validate()`. If valid, record the match.
 * 4. Skip overlapping matches (longest wins).
 *
 * Performance: O(text × validators × lengths).
 * For a 50KB document with 10 validators averaging
 * 2 lengths each, this is ~1M validate() calls at
 * ~1μs each ≈ 1 second. For real-time use, pre-
 * filter with a digit-density scan.
 */
export const find = (
  text: string,
  validators: readonly Validator[],
): FindMatch[] => {
  // Pre-compute: for each validator, the set of
  // compact lengths and the max raw length to try
  // (compact length + separator overhead).
  const specs = validators.map((v) => {
    const compactLens = inferLengths(v);
    const maxRaw = Math.max(...compactLens)
      + MAX_SEPARATOR_OVERHEAD;
    return { validator: v, compactLens, maxRaw };
  });

  const matches: FindMatch[] = [];
  const len = text.length;
  let skipTo = 0;

  for (let i = 0; i < len; i++) {
    if (i < skipTo) continue;

    // Collect all valid matches starting at
    // position i across all validators.
    let best: FindMatch | null = null;

    for (const spec of specs) {
      if (spec.compactLens.length === 0) continue;

      // Try substrings from longest to shortest
      // (prefer longer matches).
      for (
        let rawLen = Math.min(
          spec.maxRaw, len - i,
        );
        rawLen >= Math.min(...spec.compactLens);
        rawLen--
      ) {
        const candidate = text.slice(i, i + rawLen);
        const result = spec.validator.validate(
          candidate,
        );

        if (result.valid) {
          // Check this isn't inside a longer
          // alphanumeric token.
          const after = text[i + rawLen];
          if (
            after !== undefined &&
            /[a-zA-Z0-9]/.test(after)
          ) {
            continue;
          }

          // Keep the longest match at this position.
          if (
            best === null ||
            rawLen > best.end - best.start
          ) {
            best = {
              validator: spec.validator,
              start: i,
              end: i + rawLen,
              compact: result.compact,
            };
          }
          break; // found best for this validator
        }
      }
    }

    if (best) {
      // Trim leading whitespace/separators from
      // the match span to get the true start.
      let trueStart = best.start;
      while (
        trueStart < best.end &&
        /[\s\-./]/.test(text[trueStart]!)
      ) {
        trueStart++;
      }
      best.start = trueStart;
      matches.push(best);
      skipTo = best.end;
    }
  }

  return matches;
};

export default find;
