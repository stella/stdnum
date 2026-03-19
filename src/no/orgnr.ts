/**
 * Organisasjonsnummer (Norwegian organization number).
 *
 * 9 digits. Weights [3,2,7,6,5,4,3,2,1], sum % 11 === 0.
 *
 * @see https://www.brreg.no/
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [3, 2, 7, 6, 5, 4, 3, 2, 1] as const;

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Norwegian org number must be 9 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Norwegian org number must contain only digits",
    );
  }

  const sum = weightedSum(v, WEIGHTS, 11);
  if (sum !== 0) {
    return err(
      "INVALID_CHECKSUM",
      "Norwegian org number check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6)}`;
};

/** Norwegian Organization Number. */
const orgnr: Validator = {
  name: "Norwegian Organization Number",
  localName: "Organisasjonsnummer",
  abbreviation: "Orgnr",
  country: "NO",
  entityType: "company",
  examples: ["988077917"] as const,
  compact,
  format,
  validate,
};

export default orgnr;
export { compact, format, validate };
