/**
 * n° TVA (Numéro de TVA intracommunautaire).
 *
 * French VAT number. 11 characters: 2-char
 * check prefix + 9-digit SIREN. The prefix
 * can be numeric (old style) or alphanumeric
 * (new style, letters from a restricted
 * alphabet excluding I and O).
 *
 * @see https://www.economie.gouv.fr/
 */

import { luhnValidate } from "#checksums/luhn";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const ALPHABET = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";

const compact = (value: string): string => {
  let v = clean(value, " -.");
  if (v.startsWith("FR") || v.startsWith("fr")) {
    v = v.slice(2);
  }
  return v.toUpperCase();
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "French TVA must be 11 characters",
    );
  }

  const prefix = v.slice(0, 2);
  const siren = v.slice(2);

  if (!isdigits(siren)) {
    return err(
      "INVALID_FORMAT",
      "French TVA SIREN part must be digits",
    );
  }

  // Validate prefix characters are in alphabet
  const p0 = prefix[0] ?? "";
  const p1 = prefix[1] ?? "";
  if (
    ALPHABET.indexOf(p0) < 0 ||
    ALPHABET.indexOf(p1) < 0
  ) {
    return err(
      "INVALID_FORMAT",
      "French TVA prefix contains invalid chars",
    );
  }

  // SIREN validation (skip Monaco: starts with 000)
  if (!siren.startsWith("000") && !luhnValidate(siren)) {
    return err(
      "INVALID_CHECKSUM",
      "French TVA SIREN part fails Luhn check",
    );
  }

  const c0 = ALPHABET.indexOf(p0);
  const c1 = ALPHABET.indexOf(p1);

  if (c0 < 10 && c1 < 10) {
    // Old-style: both digits numeric
    const check = Number(prefix);
    const expected = Number(siren + "12") % 97;
    if (check !== expected) {
      return err(
        "INVALID_CHECKSUM",
        "French TVA check digits mismatch",
      );
    }
  } else {
    // New-style: at least one letter
    let cvalue: number;
    if (c0 < 10) {
      cvalue = c0 * 24 + c1 - 10;
    } else {
      cvalue = c0 * 34 + c1 - 100;
    }
    const sirenNum = Number(siren);
    if (
      (sirenNum + 1 + Math.floor(cvalue / 11)) % 11 !==
      cvalue % 11
    ) {
      return err(
        "INVALID_CHECKSUM",
        "French TVA check digits mismatch",
      );
    }
  }

  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `FR${compact(value)}`;

/** French VAT Number. */
const tva: Validator = {
  name: "French VAT Number",
  localName: "Numéro de TVA intracommunautaire",
  abbreviation: "TVA",
  country: "FR",
  entityType: "company",
  examples: ["40303265045", "K7399859412"] as const,
  compact,
  format,
  validate,
};

export default tva;
export { compact, format, validate };
