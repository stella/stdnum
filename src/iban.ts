/**
 * IBAN (International Bank Account Number).
 *
 * ISO 13616. Format: 2-letter country code +
 * 2 check digits + up to 30 alphanumeric BBAN
 * characters. Validated using ISO 7064 Mod 97-10.
 */

import { mod97 } from "#checksums/mod97";
import { clean } from "#util/clean";
import { charValue, isalnum } from "#util/strings";

import type {
  StdnumError,
  ValidateResult,
  Validator,
} from "./types";

/** Minimum and maximum BBAN lengths by country. */
const LENGTHS: Record<string, number> = {
  AD: 24,
  AE: 23,
  AL: 28,
  AT: 20,
  AZ: 28,
  BA: 20,
  BE: 16,
  BG: 22,
  BH: 22,
  BI: 27,
  BR: 29,
  BY: 28,
  CH: 21,
  CR: 22,
  CY: 28,
  CZ: 24,
  DE: 22,
  DJ: 27,
  DK: 18,
  DO: 28,
  EE: 20,
  EG: 29,
  ES: 24,
  FI: 18,
  FO: 18,
  FR: 27,
  GB: 22,
  GE: 22,
  GI: 23,
  GL: 18,
  GR: 27,
  GT: 28,
  HR: 21,
  HU: 28,
  IE: 22,
  IL: 23,
  IQ: 23,
  IS: 26,
  IT: 27,
  JO: 30,
  KW: 30,
  KZ: 20,
  LB: 28,
  LC: 32,
  LI: 21,
  LT: 20,
  LU: 20,
  LV: 21,
  LY: 25,
  MC: 27,
  MD: 24,
  ME: 22,
  MK: 19,
  MN: 20,
  MR: 27,
  MT: 31,
  MU: 30,
  NI: 28,
  NL: 18,
  NO: 15,
  PK: 24,
  PL: 28,
  PS: 29,
  PT: 25,
  QA: 29,
  RO: 24,
  RS: 22,
  RU: 33,
  SA: 24,
  SC: 31,
  SD: 18,
  SE: 24,
  SI: 19,
  SK: 24,
  SM: 27,
  SN: 28,
  SO: 23,
  ST: 25,
  SV: 28,
  TL: 23,
  TN: 24,
  TR: 26,
  UA: 29,
  VA: 22,
  VG: 24,
  XK: 20,
};

const err = (
  code: StdnumError["code"],
  message: string,
): ValidateResult => ({
  valid: false,
  error: { code, message },
});

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

/**
 * Convert letters to numbers (A=10, ..., Z=35)
 * and rearrange for mod-97 check.
 */
const toNumeric = (iban: string): string => {
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let result = "";
  for (let i = 0; i < rearranged.length; i++) {
    const ch = rearranged[i];
    if (ch !== undefined) {
      result += String(charValue(ch));
    }
  }
  return result;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length < 5) {
    return err("INVALID_LENGTH", "IBAN is too short");
  }
  if (!isalnum(v)) {
    return err(
      "INVALID_FORMAT",
      "IBAN must contain only letters and digits",
    );
  }
  const cc = v.slice(0, 2);
  if (!/^[A-Z]{2}$/.test(cc)) {
    return err(
      "INVALID_COMPONENT",
      "IBAN must start with a 2-letter country code",
    );
  }
  const expectedLen = LENGTHS[cc];
  if (
    expectedLen !== undefined &&
    v.length !== expectedLen
  ) {
    return err(
      "INVALID_LENGTH",
      `IBAN for ${cc} must be ${String(expectedLen)} characters`,
    );
  }
  const numeric = toNumeric(v);
  if (mod97(numeric) !== 1) {
    return err(
      "INVALID_CHECKSUM",
      "IBAN check digits are incorrect",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  const groups: string[] = [];
  for (let i = 0; i < v.length; i += 4) {
    groups.push(v.slice(i, i + 4));
  }
  return groups.join(" ");
};

/** International Bank Account Number. */
const iban: Validator = {
  name: "IBAN",
  localName: "IBAN",
  abbreviation: "IBAN",
  entityType: "any",
  compact,
  format,
  validate,
};

export default iban;
export { compact, format, validate };
