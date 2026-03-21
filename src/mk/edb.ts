/**
 * EDB (Edinstven danocen broj).
 *
 * North Macedonian tax identification number. 13 digits
 * with a weighted mod 11 checksum. May be prefixed with
 * "MK" (Latin) or "МК" (Cyrillic).
 *
 * @see https://github.com/arthurdejong/python-stdnum/blob/master/stdnum/mk/edb.py
 * @see https://www.ujp.gov.mk/
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const WEIGHTS = [
  7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2,
] as const;

const compact = (value: string): string => {
  let v = clean(value, " -");
  if (v.startsWith("MK") || v.startsWith("\u041C\u041A")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "EDB must be exactly 13 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "EDB must contain only digits",
    );
  }

  const total = weightedSum(v.slice(0, 12), WEIGHTS, 11);
  const check = ((11 - total) % 11) % 10;
  if (check !== Number(v[12])) {
    return err(
      "INVALID_CHECKSUM",
      "EDB check digit mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Generate a random valid Macedonian EDB. */
const generate = (): string => {
  const payload = randomDigits(12);
  const total = weightedSum(payload, WEIGHTS, 11);
  return payload + String(((11 - total) % 11) % 10);
};

/** North Macedonian Tax Identification Number. */
const edb: Validator = {
  name: "North Macedonian Tax ID",
  localName: "Edinstven danocen broj",
  abbreviation: "EDB",
  aliases: [
    "ЕДБ",
    "единствен даночен број",
    "EDB",
  ] as const,
  candidatePattern: "MK\\d{13}",
  country: "MK",
  entityType: "any",
  lengths: [13] as const,
  sourceUrl: "https://www.ujp.gov.mk/",
  examples: ["4002012527974"] as const,
  compact,
  format,
  validate,
  generate,
};

export default edb;
export { compact, format, validate, generate };
