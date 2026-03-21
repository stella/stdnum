/**
 * BSN (Burgerservicenummer).
 *
 * Dutch citizen service number. 9 digits (zero-padded)
 * with a weighted checksum where the last digit has
 * weight -1.
 *
 * @see https://www.government.nl/topics/personal-data/citizen-service-number-bsn
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [9, 8, 7, 6, 5, 4, 3, 2, -1] as const;

const compact = (value: string): string =>
  clean(value, " -.").padStart(9, "0");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "BSN must be exactly 9 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "BSN must contain only digits",
    );
  }

  if (Number(v) === 0) {
    return err("INVALID_FORMAT", "BSN cannot be all zeros");
  }

  const sum = weightedSum(v, WEIGHTS, 11);
  if (sum !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "BSN check does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Dutch Citizen Service Number. */
const bsn: Validator = {
  name: "Dutch Citizen Service Number",
  localName: "Burgerservicenummer",
  abbreviation: "BSN",
  country: "NL",
  entityType: "person",
  sourceUrl: 
    "https://www.government.nl/topics/personal-data/citizen-service-number-bsn",
  examples: ["111222333"] as const,
  compact,
  format,
  validate,
};

export default bsn;
export { compact, format, validate };
