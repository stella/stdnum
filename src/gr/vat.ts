/**
 * ΑΦΜ (Greek VAT number).
 *
 * 9 digits. 8-digit numbers are zero-padded.
 * Iterative checksum: cs = 0; for each d[0..7]:
 * cs = cs*2 + d; check = (cs*2) % 11 % 10 == d[8].
 *
 * @see https://www.vatify.eu/greece-vat-number.html
 * @see https://www.aade.gr/
 */

import { clean } from "#util/clean";
import { isdigits } from "#util/strings";

import type {
  StdnumError,
  ValidateResult,
  Validator,
} from "../types";

const err = (
  code: StdnumError["code"],
  message: string,
): ValidateResult => ({
  valid: false,
  error: { code, message },
});

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("EL") || v.startsWith("el")) {
    v = v.slice(2);
  }
  if (v.startsWith("GR") || v.startsWith("gr")) {
    v = v.slice(2);
  }
  // Zero-pad 8-digit numbers
  if (v.length === 8) {
    v = `0${v}`;
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Greek VAT number must be 9 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Greek VAT number must contain only digits",
    );
  }
  let cs = 0;
  for (let i = 0; i < 8; i++) {
    cs = cs * 2 + Number(v[i]);
  }
  const check = ((cs * 2) % 11) % 10;
  if (check !== Number(v[8])) {
    return err(
      "INVALID_CHECKSUM",
      "Greek VAT number check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `EL${compact(value)}`;

/** Greek VAT Number. */
const vat: Validator = {
  name: "Greek VAT Number",
  localName: "Αριθμός Φορολογικού Μητρώου",
  abbreviation: "ΑΦΜ",
  country: "GR",
  entityType: "any",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };
