/**
 * Generate a random valid Steuernummer.
 * Uses Berlin regional format (FFBBBUUUUP, 10 digits).
 */
const generate = (): string => {
  const ff = randomDigits(2);
  const bbb = randomDigits(3);
  const uuuu = randomDigits(4);
  const p = randomDigits(1);
  return `${ff}${bbb}${uuuu}${p}`;
};

/**
 * StNr (Steuernummer).
 *
 * German tax number assigned by the local tax office.
 * Regional format: 10 or 11 digits. Unified federal
 * format: 13 digits (prefixed with a 2–4 digit BUFA
 * code). Structure varies by federal state.
 *
 * The number encodes: BUFA (Bundesfinanzamtsnummer),
 * district code, serial number, and check digit. No
 * algorithmic check digit validation is standardised
 * across all states; validation is format-only.
 *
 * @see https://de.wikipedia.org/wiki/Steuernummer
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";
import { randomDigits } from "#util/generate";

import type { ValidateResult, Validator } from "../types";

/**
 * Format patterns per federal state.
 * [0] = regional format, [1] = unified (federal) format.
 *
 * Legend: F = finance office, B = district,
 *         U = serial, P = check digit,
 *         leading digits are literal.
 */
const STATES = {
  "Baden-Württemberg": [
    "FFBBBUUUUP",
    "28FF0BBBUUUUP",
  ],
  Bayern: [
    "FFFBBBUUUUP",
    "9FFF0BBBUUUUP",
  ],
  Berlin: [
    "FFBBBUUUUP",
    "11FF0BBBUUUUP",
  ],
  Brandenburg: [
    "0FFBBBUUUUP",
    "30FF0BBBUUUUP",
  ],
  Bremen: [
    "FFBBBUUUUP",
    "24FF0BBBUUUUP",
  ],
  Hamburg: [
    "FFBBBUUUUP",
    "22FF0BBBUUUUP",
  ],
  Hessen: [
    "0FFBBBUUUUP",
    "26FF0BBBUUUUP",
  ],
  "Mecklenburg-Vorpommern": [
    "0FFBBBUUUUP",
    "40FF0BBBUUUUP",
  ],
  Niedersachsen: [
    "FFBBBUUUUP",
    "23FF0BBBUUUUP",
  ],
  "Nordrhein-Westfalen": [
    "FFFBBBBUUUP",
    "5FFF0BBBBUUUP",
  ],
  "Rheinland-Pfalz": [
    "FFBBBUUUUP",
    "27FF0BBBUUUUP",
  ],
  Saarland: [
    "0FFBBBUUUUP",
    "10FF0BBBUUUUP",
  ],
  Sachsen: [
    "2FFBBBUUUUP",
    "32FF0BBBUUUUP",
  ],
  "Sachsen-Anhalt": [
    "1FFBBBUUUUP",
    "31FF0BBBUUUUP",
  ],
  "Schleswig-Holstein": [
    "FFBBBUUUUP",
    "21FF0BBBUUUUP",
  ],
  Thüringen: [
    "1FFBBBUUUUP",
    "41FF0BBBUUUUP",
  ],
} as const;

type StateName = keyof typeof STATES;

/**
 * Convert a format pattern to a regex.
 * Literal digits match themselves; F/B/U match any
 * digit; P (check digit) matches any digit.
 */
const patternToRegex = (pattern: string): RegExp => {
  let re = "^";
  for (const ch of pattern) {
    if (ch >= "0" && ch <= "9") {
      re += ch;
    } else {
      re += "\\d";
    }
  }
  re += "$";
  return new RegExp(re);
};

/** Pre-compiled regexes for each state + format. */
const COMPILED: Array<{
  state: StateName;
  regional: RegExp;
  regionalFmt: string;
  federal: RegExp;
  federalFmt: string;
}> = (
  Object.entries(STATES) as Array<
    [StateName, readonly [string, string]]
  >
).map(([state, [regionalFmt, federalFmt]]) => ({
  state,
  regional: patternToRegex(regionalFmt),
  regionalFmt,
  federal: patternToRegex(federalFmt),
  federalFmt,
}));

const compact = (value: string): string =>
  clean(value, " -/.");

const matchesAnyPattern = (v: string): boolean => {
  for (const { regional, federal } of COMPILED) {
    if (regional.test(v) || federal.test(v)) return true;
  }
  return false;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "German Steuernummer must contain only digits",
    );
  }

  if (v.length !== 10 && v.length !== 11 && v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "German Steuernummer must be 10, 11, or 13 digits",
    );
  }

  if (!matchesAnyPattern(v)) {
    return err(
      "INVALID_COMPONENT",
      "German Steuernummer does not match any " +
        "known state format",
    );
  }

  return { valid: true, compact: v };
};

/**
 * Format with slashes at segment boundaries.
 * Uses the first matching state pattern to determine
 * segment positions.
 */
const format = (value: string): string => {
  const v = compact(value);

  for (const entry of COMPILED) {
    const pattern =
      v.length === 13 ? entry.federal : entry.regional;
    if (!pattern.test(v)) continue;

    const fmt =
      v.length === 13
        ? entry.federalFmt
        : entry.regionalFmt;

    // Group by consecutive runs of the same letter
    // category: literal digits, F, B, U, P
    const segments: string[] = [];
    let segStart = 0;
    let prevCat = charCat(fmt[0]!);

    for (let i = 1; i < fmt.length; i++) {
      const cat = charCat(fmt[i]!);
      if (cat !== prevCat) {
        segments.push(v.slice(segStart, i));
        segStart = i;
        prevCat = cat;
      }
    }
    segments.push(v.slice(segStart));

    return segments.join("/");
  }

  return v;
};

const charCat = (ch: string): string => {
  if (ch >= "0" && ch <= "9") return "L"; // literal
  return ch; // F, B, U, P
};

/** German Tax Number (Steuernummer). */
const stnr: Validator = {
  name: "German Tax Number",
  localName: "Steuernummer",
  abbreviation: "StNr",
  aliases: [
    "Steuernummer",
    "St.Nr.",
  ] as const,
  candidatePattern: "\\d{2,4}/\\d{3,4}/\\d{4,5}",
  country: "DE",
  entityType: "any",
  description:
    "German tax number assigned by the local " +
    "tax office, varies by federal state",
  sourceUrl:
    "https://de.wikipedia.org/wiki/Steuernummer",
  lengths: [10, 11, 13] as const,
  examples: ["2181508150", "18181508155"] as const,
  compact,
  format,
  validate,
  generate,
};

export default stnr;
export { compact, format, validate, generate };
