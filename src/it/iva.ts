/**
 * Partita IVA (Italian VAT number).
 *
 * 11 digits: 7-digit company ID + 3-digit
 * province code + Luhn check digit.
 *
 * @see https://www.agenziaentrate.gov.it/
 */

import { luhnValidate } from "#checksums/luhn";
import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const VALID_PROVINCES = new Set([
  ...Array.from({ length: 100 }, (_, i) =>
    String(i + 1).padStart(3, "0"),
  ),
  "120",
  "121",
  "888",
  "999",
]);

const compact = (value: string): string => {
  let v = clean(value, " -");
  if (v.startsWith("IT") || v.startsWith("it")) {
    v = v.slice(2);
  }
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "Partita IVA must be exactly 11 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Partita IVA must contain only digits",
    );
  }
  // First 7 digits cannot all be zero
  if (/^0{7}/.test(v)) {
    return err(
      "INVALID_COMPONENT",
      "Partita IVA company ID cannot be all zeros",
    );
  }
  // Province code validation
  const province = v.slice(7, 10);
  if (!VALID_PROVINCES.has(province)) {
    return err(
      "INVALID_COMPONENT",
      "Partita IVA province code is invalid",
    );
  }
  if (!luhnValidate(v)) {
    return err(
      "INVALID_CHECKSUM",
      "Partita IVA fails Luhn check",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string =>
  `IT${compact(value)}`;

/** Italian VAT Number. */
const iva: Validator = {
  name: "Italian VAT Number",
  localName: "Partita IVA",
  abbreviation: "P.IVA",
  country: "IT",
  entityType: "company",
  sourceUrl: "https://www.agenziaentrate.gov.it/",
  examples: ["00743110157"] as const,
  compact,
  format,
  validate,
};

export default iva;
export { compact, format, validate };
