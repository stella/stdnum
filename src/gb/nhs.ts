/**
 * UK NHS Number.
 *
 * Validates the 10-digit NHS number using the
 * modulus 11 checksum used by NHS England.
 */

import type {
  CountryValidator,
  ValidateResult,
} from "../types";

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

const NHS_NUMBER_LENGTH = 10;
const CHECK_DIGIT_INDEX = 9;

const compact = (value: string): string =>
  clean(value, " ");

const calcCheckDigit = (value: string): number | null => {
  if (value.length !== NHS_NUMBER_LENGTH) return null;
  if (!isdigits(value)) return null;

  let total = 0;
  for (let i = 0; i < CHECK_DIGIT_INDEX; i += 1) {
    total += Number(value.charAt(i)) * (10 - i);
  }

  const check = 11 - (total % 11);
  if (check === 10) return null;
  return check === 11 ? 0 : check;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== NHS_NUMBER_LENGTH) {
    return err(
      "INVALID_LENGTH",
      "NHS number must be 10 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "NHS number must contain only digits",
    );
  }

  const check = calcCheckDigit(v);
  if (
    check === null ||
    check !== Number(v.charAt(CHECK_DIGIT_INDEX))
  ) {
    return err(
      "INVALID_CHECKSUM",
      "NHS number fails modulus 11 check",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length !== NHS_NUMBER_LENGTH) return v;
  return `${v.slice(0, 3)} ${v.slice(3, 6)} ${v.slice(6)}`;
};

const nhs: CountryValidator<"GB"> = {
  scope: "country",
  country: "GB",
  name: "UK NHS Number",
  localName: "NHS number",
  abbreviation: "NHS",
  aliases: [
    "NHS number",
    "National Health Service number",
  ] as const,
  candidatePattern: "\\d{3}\\s?\\d{3}\\s?\\d{4}",
  entityType: "person",
  lengths: [NHS_NUMBER_LENGTH] as const,
  examples: ["4010232137"] as const,
  compact,
  format,
  validate,
};

export default nhs;
export { calcCheckDigit, compact, format, validate };
