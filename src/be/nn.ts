/**
 * NN (Numéro national / Rijksregisternummer).
 *
 * Belgian national identification number. 11 digits
 * encoding date of birth, serial number, and a
 * check digit pair. The first 6 digits are YYMMDD,
 * followed by a 3-digit serial and 2 check digits.
 *
 * @see https://fr.wikipedia.org/wiki/Numéro_de_registre_national
 * @see https://www.ibz.rrn.fgov.be/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " .-");

/**
 * Verify the mod-97 checksum and return the detected
 * century (1900 or 2000). Returns null on mismatch.
 * Matches python-stdnum's _checksum logic: the 2000s
 * century is only attempted when YY+2000 <= current year.
 */
const checksum = (v: string): number | null => {
  const first9 = Number(v.slice(0, 9));
  const check = Number(v.slice(9, 11));

  if (97 - (first9 % 97) === check) return 1900;

  const yy = Number(v.slice(0, 2));
  if (yy + 2000 <= new Date().getFullYear()) {
    const with2 = Number(`2${v.slice(0, 9)}`);
    if (97 - (with2 % 97) === check) return 2000;
  }

  return null;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "NN must be exactly 11 digits",
    );
  }
  if (!isdigits(v) || Number(v) === 0) {
    return err(
      "INVALID_FORMAT",
      "NN must contain only digits",
    );
  }

  if (checksum(v) === null) {
    return err(
      "INVALID_CHECKSUM",
      "NN check digits do not match",
    );
  }

  // Raw month digits must be 0..12 (values 13+ are
  // invalid; counter-exhaustion uses 00, not 20+).
  const rawMonth = Number(v.slice(2, 4));
  if (rawMonth > 12) {
    return err(
      "INVALID_COMPONENT",
      "Month must be in 0..12",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 2)}.${v.slice(2, 4)}.${v.slice(4, 6)}-${v.slice(6, 9)}.${v.slice(9)}`;
};

/** Belgian National Number. */
const nn: Validator = {
  name: "Belgian National Number",
  localName: "Numéro national",
  abbreviation: "NN",
  aliases: [
    "rijksregisternummer",
    "numéro national",
    "NN",
  ] as const,
  candidatePattern:
    "\\d{2}\\.?\\d{2}\\.?\\d{2}-?\\d{3}\\.?\\d{2}",
  country: "BE",
  entityType: "person",
  sourceUrl: "https://www.ibz.rrn.fgov.be/",
  examples: ["93051822361"] as const,
  compact,
  format,
  validate,
};

export default nn;
export { checksum, compact, format, validate };
