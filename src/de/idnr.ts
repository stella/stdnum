/**
 * IdNr (Steuerliche Identifikationsnummer).
 *
 * German personal tax identification number.
 * 11 digits; the last digit is a check digit
 * (ISO 7064 Mod 11,10). Exactly one digit
 * appears twice or three times; the rest are
 * unique. The first digit cannot be 0.
 *
 * @see https://www.bzst.de/DE/Privatpersonen/SteuerlicheIdentifikationsnummer/steuerlicheidentifikationsnummer_node.html
 */

import { mod1110validate } from "#checksums/mod1110";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -/");

/**
 * Validate digit distribution: in the first 10
 * digits, exactly one digit appears 2 or 3
 * times; all others appear exactly once.
 */
const validDistribution = (value: string): boolean => {
  const counts = Array.from<number>({ length: 10 }).fill(0);
  for (let i = 0; i < 10; i++) {
    counts[Number(value[i])]++;
  }
  let doubles = 0;
  let triples = 0;
  for (const c of counts) {
    if (c === 2) doubles++;
    if (c === 3) triples++;
    if (c > 3) return false;
  }
  // Exactly one digit repeated (2 or 3 times)
  return (
    (doubles === 1 && triples === 0) ||
    (doubles === 0 && triples === 1)
  );
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "German IdNr must be 11 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "German IdNr must contain only digits",
    );
  }
  if (v[0] === "0") {
    return err(
      "INVALID_COMPONENT",
      "German IdNr cannot start with 0",
    );
  }
  if (!validDistribution(v)) {
    return err(
      "INVALID_COMPONENT",
      "German IdNr digit distribution invalid",
    );
  }
  if (!mod1110validate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "German IdNr check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 2)} ${v.slice(2, 5)} ${v.slice(5, 8)} ${v.slice(8)}`;
};

/** German Personal Tax ID. */
const idnr: Validator = {
  name: "German Tax ID",
  localName: "Steuerliche Identifikationsnummer",
  abbreviation: "IdNr",
  aliases: [
    "Steuerliche Identifikationsnummer",
    "IdNr",
    "Steuer-ID",
  ] as const,
  candidatePattern:
    "\\d{2}\\s?\\d{3}\\s?\\d{3}\\s?\\d{3}",
  country: "DE",
  entityType: "person",
  sourceUrl: 
    "https://www.bzst.de/DE/Privatpersonen/SteuerlicheIdentifikationsnummer/steuerlicheidentifikationsnummer_node.html",
  examples: ["36574261809"] as const,
  compact,
  format,
  validate,
};

export default idnr;
export { compact, format, validate };
