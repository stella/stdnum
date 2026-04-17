/**
 * Swiss Social Security Number (AHV/AVS).
 *
 * 13 digits starting with 756. Uses EAN-13 checksum:
 * alternating weights (1, 3) from left, check digit
 * is (10 - sum % 10) % 10.
 *
 * @see https://www.bsv.admin.ch/
 */

import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -.");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "Swiss SSN must be 13 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Swiss SSN must contain only digits",
    );
  }
  if (!v.startsWith("756")) {
    return err(
      "INVALID_COMPONENT",
      "Swiss SSN must start with 756",
    );
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const weight = i % 2 === 0 ? 1 : 3;
    sum += Number(v[i]) * weight;
  }
  const check = (10 - (sum % 10)) % 10;
  if (check !== Number(v[12])) {
    return err(
      "INVALID_CHECKSUM",
      "Swiss SSN check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 3)}.${v.slice(3, 7)}.${v.slice(7, 11)}.${v.slice(11)}`;
};

/** Generate a random valid Swiss SSN. */
const generate = (): string => {
  const payload = "756" + randomDigits(9);
  let sum = 0;
  for (let i = 0; i < 12; i++)
    sum += Number(payload[i]) * (i % 2 === 0 ? 1 : 3);
  return payload + String((10 - (sum % 10)) % 10);
};

/** Swiss Social Security Number. */
const ssn: Validator = {
  name: "Swiss Social Security Number",
  localName: "AHV-Versichertennummer",
  abbreviation: "AHV",
  aliases: [
    "AHV-Nummer",
    "numéro AVS",
    "AVS",
    "AHV",
  ] as const,
  candidatePattern: "756\\.?\\d{4}\\.?\\d{4}\\.?\\d{2}",
  country: "CH",
  entityType: "person",
  sourceUrl: "https://www.bsv.admin.ch/",
  examples: ["7561234567897"] as const,
  compact,
  format,
  validate,
  generate,
};

export default ssn;
export { compact, format, validate, generate };
