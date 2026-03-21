/**
 * PIN (Personal Identification Number, პირადი ნომერი).
 *
 * Georgian personal identification number issued by the
 * Public Service Development Agency. Citizens receive an
 * 11-digit number (also used as TIN); non-citizens and
 * entities receive a 9-digit number. The number is a
 * serial with no embedded semantics and no publicly
 * documented checksum algorithm.
 *
 * @see https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Georgia-TIN.pdf
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -").trim();

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 9 && v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "Georgian PIN must be 9 or 11 digits",
    );
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Georgian PIN must contain only digits",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Georgian Personal Identification Number. */
const pin: Validator = {
  name: "Georgian Personal ID",
  localName: "პირადი ნომერი",
  abbreviation: "PIN",
  aliases: [
    "პირადი ნომერი",
    "PIN",
  ] as const,
  candidatePattern: "\\d{11}",
  country: "GE",
  entityType: "any",
  lengths: [9, 11] as const,
  examples: ["010043120", "01024030303"] as const,
  compact,
  format,
  validate,
  sourceUrl:
    "https://www.oecd.org/tax/automatic-exchange/"
    + "crs-implementation-and-assistance/"
    + "tax-identification-numbers/Georgia-TIN.pdf",
};

export default pin;
export { compact, format, validate };
