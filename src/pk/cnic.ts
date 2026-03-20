/**
 * CNIC (Computerized National Identity Card, Pakistan).
 *
 * 13 digits: PPPPP-DDDDDDD-G where P is a province/
 * district code (5 digits), D is a sequential number
 * (7 digits), and G is a gender digit (odd = male,
 * even = female). No checksum; structural validation.
 *
 * @see https://en.wikipedia.org/wiki/CNIC_(Pakistan)
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "CNIC must be 13 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "CNIC must contain only digits",
    );
  }
  // Province code cannot be all zeros.
  if (v.slice(0, 5) === "00000") {
    return err(
      "INVALID_COMPONENT",
      "CNIC province code cannot be 00000",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 5)}-${v.slice(5, 12)}-${v.slice(12)}`;
};

/** Pakistan Computerized National Identity Card. */
const cnic: Validator = {
  name: "Computerized National Identity Card",
  localName: "Computerized National Identity Card",
  abbreviation: "CNIC",
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
};

export default cnic;
export { compact, format, validate };
