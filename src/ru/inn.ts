/**
 * INN (Идентификационный номер налогоплательщика).
 *
 * Russian taxpayer identification number. 10 digits
 * for companies (1 check digit), 12 digits for
 * individuals (2 check digits). Check digits are
 * computed as weighted sum mod 11 mod 10.
 *
 * @see https://en.wikipedia.org/wiki/Taxpayer_Identification_Number_(Russia)
 * @see https://www.nalog.gov.ru/
 */

import { clean } from "#util/clean";
import { randomDigits } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS_10 = [2, 4, 10, 3, 5, 9, 4, 6, 8] as const;
const WEIGHTS_11 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8] as const;
const WEIGHTS_12 = [
  3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8,
] as const;

const checkDigit = (
  value: string,
  weights: readonly number[],
): number => {
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += Number(value[i]) * weights[i]!;
  }
  return (sum % 11) % 10;
};

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10 && v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "INN must be 10 or 12 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "INN must contain only digits",
    );
  }

  if (v.length === 10) {
    const check = checkDigit(v, WEIGHTS_10);
    if (check !== Number(v[9])) {
      return err(
        "INVALID_CHECKSUM",
        "INN check digit mismatch",
      );
    }
  } else {
    const check11 = checkDigit(v, WEIGHTS_11);
    const check12 = checkDigit(v, WEIGHTS_12);
    if (
      check11 !== Number(v[10]) ||
      check12 !== Number(v[11])
    ) {
      return err(
        "INVALID_CHECKSUM",
        "INN check digit mismatch",
      );
    }
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Generate a random valid 10-digit Russian INN. */
const generate = (): string => {
  for (;;) {
    const c = randomDigits(10);
    if (validate(c).valid) return c;
  }
};

/** Russian Taxpayer Identification Number. */
const inn: Validator = {
  name: "Russian Tax ID",
  localName: "Идентификационный номер налогоплательщика",
  abbreviation: "ИНН",
  aliases: ["ИНН", "INN"] as const,
  candidatePattern: "\\d{10,12}",
  country: "RU",
  entityType: "any",
  lengths: [10, 12] as const,
  sourceUrl: "https://www.nalog.gov.ru/",
  examples: ["7707083893", "526317984689"] as const,
  compact,
  format,
  validate,
  generate,
};

export default inn;
export { compact, format, validate, generate };
