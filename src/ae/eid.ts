/**
 * Emirates ID (رقم الهوية, UAE).
 *
 * 15 digits: 784-YYYY-NNNNNNN-C where 784 is the
 * ISO 3166-1 numeric code for the UAE, YYYY is the
 * year of birth, NNNNNNN is a serial number, and C
 * is a Luhn check digit.
 *
 * @see https://en.wikipedia.org/wiki/National_identification_number#United_Arab_Emirates
 * @see https://u.ae/en/information-and-services/visa-and-emirates-id/emirates-id
 */

import {
  luhnChecksum,
  luhnValidate,
} from "#checksums/luhn";
import { clean } from "#util/clean";
import { randomDigits, randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -/");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 15) {
    return err(
      "INVALID_LENGTH",
      "Emirates ID must be 15 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Emirates ID must contain only digits",
    );
  }
  if (!v.startsWith("784")) {
    return err(
      "INVALID_COMPONENT",
      "Emirates ID must start with 784",
    );
  }
  if (!luhnValidate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "Emirates ID Luhn check digit is invalid",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return [
    v.slice(0, 3),
    v.slice(3, 7),
    v.slice(7, 14),
    v.slice(14),
  ].join("-");
};

/**
 * Generate a random valid Emirates ID in compact
 * form. NOT cryptographically secure.
 */
const generate = (): string => {
  const yyyy = String(randomInt(1950, 2010));
  const serial = randomDigits(7);
  const partial = `784${yyyy}${serial}0`;
  const remainder = luhnChecksum(partial);
  const check = (10 - remainder) % 10;
  return `784${yyyy}${serial}${String(check)}`;
};

/** UAE Emirates ID. */
const eid: Validator = {
  name: "Emirates ID",
  localName: "رقم الهوية",
  abbreviation: "EID",
  aliases: [
    "Emirates ID",
    "Resident ID",
    "رقم الهوية",
    "EID",
  ] as const,
  candidatePattern:
    "784-?\\d{4}-?\\d{7}-?\\d",
  country: "AE",
  entityType: "person",
  lengths: [15],
  examples: [
    "784198012345678",
    "784197912345671",
    "784195204640486",
    "784196865703050",
  ] as const,
  description:
    "15-digit identity number issued to UAE residents",
  sourceUrl:
    "https://u.ae/en/information-and-services/visa-and-emirates-id/emirates-id",
  compact,
  format,
  validate,
  generate,
};

export default eid;
export { compact, format, generate, validate };
