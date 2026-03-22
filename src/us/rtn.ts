/**
 * RTN (Routing Transit Number / ABA Number).
 *
 * 9-digit number used by U.S. financial institutions
 * for routing wire transfers, ACH, and check
 * processing. Uses a weighted checksum with weights
 * [3, 7, 1] repeated three times.
 *
 * The first two digits identify the Federal Reserve
 * district (01-12) or special ranges (21-32 for
 * thrifts, 61-72 for electronic, 80 for traveler's
 * cheques).
 *
 * @see https://en.wikipedia.org/wiki/ABA_routing_transit_number
 * @see https://www.frbservices.org/
 */

import { clean } from "#util/clean";
import { randomDigits, randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [3, 7, 1, 3, 7, 1, 3, 7, 1];

const compact = (value: string): string =>
  clean(value, " -").trim();

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "RTN must be 9 digits",
    );
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "RTN must contain only digits",
    );
  }

  // Validate Federal Reserve prefix (first 2 digits)
  const prefix = Number(v.slice(0, 2));
  const validPrefixRanges =
    (prefix >= 1 && prefix <= 12)
    || (prefix >= 21 && prefix <= 32)
    || (prefix >= 61 && prefix <= 72)
    || prefix === 80;
  if (!validPrefixRanges) {
    return err(
      "INVALID_COMPONENT",
      "RTN has an invalid Federal Reserve district",
    );
  }

  // Weighted checksum must be divisible by 10
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += Number(v[i]) * WEIGHTS[i]!;
  }
  if (sum % 10 !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "RTN checksum is invalid",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Generate a random valid U.S. RTN. */
const generate = (): string => {
  const prefix = String(randomInt(1, 12)).padStart(
    2,
    "0",
  );
  const mid = randomDigits(6);
  const body = prefix + mid;
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    sum += Number(body[i]) * WEIGHTS[i]!;
  }
  const check = (10 - (sum % 10)) % 10;
  return body + String(check);
};

/** U.S. Routing Transit Number. */
const rtn: Validator = {
  name: "Routing Transit Number",
  localName: "Routing Transit Number",
  abbreviation: "RTN",
  aliases: [
    "RTN",
    "ABA",
    "Routing Number",
    "ABA Routing Number",
    "Routing Transit Number",
  ] as const,
  candidatePattern: "\\d{9}",
  country: "US",
  entityType: "company",
  sourceUrl:
    "https://en.wikipedia.org/wiki/ABA_routing_transit_number",
  lengths: [9] as const,
  examples: ["111000025", "021000021"] as const,
  compact,
  format,
  validate,
  generate,
};

export default rtn;
export { compact, format, validate, generate };
