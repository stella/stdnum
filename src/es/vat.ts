/**
 * NIF/CIF (Spanish VAT number).
 *
 * 9 characters with 4 subtypes: DNI, NIE, CIF,
 * and K/L/M personal numbers.
 *
 * @see https://www.vatify.eu/spain-vat-number.html
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

const DNI_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";
const CIF_LETTERS = "JABCDEFGHI";

const compact = (value: string): string => {
  let v = clean(value, " -/.");
  if (v.startsWith("ES") || v.startsWith("es")) {
    v = v.slice(2);
  }
  return v.toUpperCase();
};

const cifChecksum = (digits: string): number => {
  let even = 0;
  let odd = 0;
  for (let i = 0; i < 7; i++) {
    const d = Number(digits[i]);
    if (i % 2 === 0) {
      // Odd positions (1-indexed): double and sum digits
      const doubled = d * 2;
      odd += Math.floor(doubled / 10) + (doubled % 10);
    } else {
      even += d;
    }
  }
  return (10 - ((even + odd) % 10)) % 10;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Spanish VAT number must be 9 characters",
    );
  }

  const first = v[0];
  const last = v[8];

  // DNI: 8 digits + letter
  if (isdigits(v.slice(0, 8))) {
    const expected =
      DNI_LETTERS[Number.parseInt(v.slice(0, 8), 10) % 23];
    if (last !== expected) {
      return err(
        "INVALID_CHECKSUM",
        "Spanish DNI check letter mismatch",
      );
    }
    return { valid: true, compact: v };
  }

  // NIE: X/Y/Z + 7 digits + letter
  if (first === "X" || first === "Y" || first === "Z") {
    const prefix =
      first === "X" ? "0" : first === "Y" ? "1" : "2";
    const digits = prefix + v.slice(1, 8);
    if (!isdigits(digits) || !isdigits(v.slice(1, 8))) {
      return err(
        "INVALID_FORMAT",
        "Spanish NIE must have 7 digits after prefix",
      );
    }
    const expected =
      DNI_LETTERS[Number.parseInt(digits, 10) % 23];
    if (last !== expected) {
      return err(
        "INVALID_CHECKSUM",
        "Spanish NIE check letter mismatch",
      );
    }
    return { valid: true, compact: v };
  }

  // K, L, M: personal number, letter + 7 digits +
  // check letter
  if (first === "K" || first === "L" || first === "M") {
    if (!isdigits(v.slice(1, 8))) {
      return err(
        "INVALID_FORMAT",
        "Spanish K/L/M number must have 7 digits",
      );
    }
    const expected =
      DNI_LETTERS[Number.parseInt(v.slice(1, 8), 10) % 23];
    if (last !== expected) {
      return err(
        "INVALID_CHECKSUM",
        "Spanish K/L/M check letter mismatch",
      );
    }
    return { valid: true, compact: v };
  }

  // CIF: letter + 7 digits + check digit/letter
  const CIF_PREFIXES = "ABCDEFGHJNPQRSUVW";
  if (CIF_PREFIXES.includes(first)) {
    if (!isdigits(v.slice(1, 8))) {
      return err(
        "INVALID_FORMAT",
        "Spanish CIF must have 7 digits after prefix",
      );
    }
    const check = cifChecksum(v.slice(1, 8));
    // Some prefixes require letter check,
    // some digit, some accept either
    const LETTER_ONLY = "NPQRSW";
    const DIGIT_ONLY = "ABEH";
    if (LETTER_ONLY.includes(first)) {
      if (last !== CIF_LETTERS[check]) {
        return err(
          "INVALID_CHECKSUM",
          "Spanish CIF check letter mismatch",
        );
      }
    } else if (DIGIT_ONLY.includes(first)) {
      if (last !== String(check)) {
        return err(
          "INVALID_CHECKSUM",
          "Spanish CIF check digit mismatch",
        );
      }
    } else {
      // Accept either
      if (
        last !== String(check) &&
        last !== CIF_LETTERS[check]
      ) {
        return err(
          "INVALID_CHECKSUM",
          "Spanish CIF check digit/letter mismatch",
        );
      }
    }
    return { valid: true, compact: v };
  }

  return err(
    "INVALID_FORMAT",
    "Spanish VAT number has invalid format",
  );
};

const format = (value: string): string =>
  `ES${compact(value)}`;

/** Spanish VAT Number. */
const vat: Validator = {
  name: "Spanish VAT Number",
  localName: "Número de Identificación Fiscal",
  abbreviation: "NIF",
  country: "ES",
  entityType: "any",
  compact,
  format,
  validate,
};

export default vat;
export { compact, format, validate };
