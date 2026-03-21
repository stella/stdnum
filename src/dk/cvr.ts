/**
 * CVR (Central Business Register number).
 *
 * 8 digits, no leading 0.
 * Weights [2,7,6,5,4,3,2,1], sum % 11 === 0.
 *
 * Same algorithm as the Danish VAT number, but this
 * is the company register identifier.
 *
 * @see https://erhvervsstyrelsen.dk/
 *
 * Denmark dropped mod-11 for CPR in 2007; unconfirmed
 * for CVR.
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits, randomInt } from "#util/generate";

const WEIGHTS = [2, 7, 6, 5, 4, 3, 2, 1];

const compact = (value: string): string =>
  clean(value, " -/.");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Danish CVR must be 8 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Danish CVR must contain only digits",
    );
  }
  if (v[0] === "0") {
    return err(
      "INVALID_COMPONENT",
      "Danish CVR cannot start with 0",
    );
  }
  const sum = weightedSum(v, WEIGHTS, 11);
  if (sum !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Danish CVR check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Generate a random valid Danish CVR. */
const generate = (): string => { for (;;) { const c = String(randomInt(1, 9)) + randomDigits(7); if (validate(c).valid) return c; } };

/** Danish Central Business Register Number. */
const cvr: Validator = {
  name: "Danish Business Register Number",
  localName: "CVR-nummer",
  abbreviation: "CVR",
  country: "DK",
  entityType: "company",
  sourceUrl: "https://erhvervsstyrelsen.dk/",
  examples: ["13585628"] as const,
  compact,
  format,
  validate,
  generate,
};

export default cvr;
export { compact, format, validate, generate };
