/** Generate a random valid Pakistan CNIC. */
const generate = (): string => {
  const province = String(randomInt(1, 7));
  const district = randomDigits(4);
  const serial = randomDigits(7);
  const gender = String(randomInt(1, 9));
  return `${province}${district}${serial}${gender}`;
};

/**
 * CNIC (Computerized National Identity Card, Pakistan).
 *
 * 13 digits: PPPPP-DDDDDDD-G where P is a province/
 * district code (5 digits), D is a sequential number
 * (7 digits), and G is a gender digit (odd = male,
 * even = female, including 0). No checksum; structural
 * validation.
 *
 * @see https://www.geo.tv/latest/157233-secret-behind-every-digit-of-the-cnic-number
 * @see https://en.wikipedia.org/wiki/CNIC_(Pakistan)
 */

import type {
  ValidateResult,
  CountryValidator,
} from "../types";

import { clean } from "#util/clean";
import { randomDigits, randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

const compact = (value: string): string =>
  clean(value, " -");

/** Valid province IDs (first digit). */
const VALID_PROVINCES = new Set([
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
]);

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 13) {
    return err("INVALID_LENGTH", "CNIC must be 13 digits");
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "CNIC must contain only digits",
    );
  }
  // First digit must be a valid province code
  // SAFETY: v.length === 13 above guarantees v[0] exists.
  // eslint-disable-next-line no-non-null-assertion
  if (!VALID_PROVINCES.has(v[0]!)) {
    return err(
      "INVALID_COMPONENT",
      "CNIC province code is invalid",
    );
  }
  // Last digit indicates gender: odd = male,
  // even = female. Digit 0 is rejected per
  // python-stdnum convention; NADRA does not
  // publish whether 0 is a valid gender code.
  // @see https://www.geo.tv/latest/157233
  if (v[12] === "0") {
    return err(
      "INVALID_COMPONENT",
      "CNIC gender digit must not be 0",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 5)}-${v.slice(5, 12)}-${v.slice(12)}`;
};

/** Pakistan Computerized National Identity Card. */
const cnic: CountryValidator<"PK"> = {
  name: "Computerized National Identity Card",
  localName: "Computerized National Identity Card",
  abbreviation: "CNIC",
  aliases: ["CNIC", "شناختی کارڈ"] as const,
  candidatePattern: "\\d{5}-?\\d{7}-?\\d",
  scope: "country",
  country: "PK",
  entityType: "person",
  lengths: [13],
  examples: ["3520112345671", "4210112345672"],
  description:
    "13-digit identity card number issued by NADRA",
  sourceUrl:
    "https://en.wikipedia.org/wiki/CNIC_(Pakistan)",
  compact,
  format,
  validate,
  generate,
};

export default cnic;
export { compact, format, validate, generate };
