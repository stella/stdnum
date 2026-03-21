/**
 * NSS (Número de la Seguridad Social).
 *
 * Spanish Social Security Number. 12 digits:
 * 2-digit province code (01–52) + 8-digit affiliate
 * number + 2-digit check digits.
 *
 * Check digits are computed as:
 *   if affiliate < 10_000_000:
 *     (affiliate + province × 10_000_000) mod 97
 *   else:
 *     parseInt(province + affiliate) mod 97
 *
 * @see https://www.seg-social.es/
 * @see https://intervia.com/doc/validar-numeros-de-la-seguridad-social/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";
import { randomDigits } from "#util/generate";

const compact = (value: string): string =>
  clean(value, " -/.");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 12) {
    return err(
      "INVALID_LENGTH",
      "Spanish NSS must be 12 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Spanish NSS must contain only digits",
    );
  }

  const province = Number(v.slice(0, 2));
  if (province < 1 || province > 52) {
    return err(
      "INVALID_COMPONENT",
      "Spanish NSS province code must be 01–52",
    );
  }

  const affiliate = Number(v.slice(2, 10));
  const check = Number(v.slice(10, 12));

  let base: number;
  if (affiliate < 10_000_000) {
    base = affiliate + province * 10_000_000;
  } else {
    // Concatenate province and affiliate as a number
    base = Number(`${province}${v.slice(2, 10)}`);
  }

  const expected = base % 97;

  if (expected !== check) {
    return err(
      "INVALID_CHECKSUM",
      "Spanish NSS check digits do not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  return `${v.slice(0, 2)}/${v.slice(2, 10)}/${v.slice(10)}`;
};

/** Generate a random valid Spanish NSS. */
const generate = (): string => { for (;;) { const c = randomDigits(12); if (validate(c).valid) return c; } };

/** Spanish Social Security Number. */
const nss: Validator = {
  name: "Spanish Social Security Number",
  localName: "Número de la Seguridad Social",
  abbreviation: "NSS",
  country: "ES",
  entityType: "person",
  description:
    "Spanish Social Security affiliation number " +
    "with mod-97 check digits",
  sourceUrl: "https://www.seg-social.es/",
  lengths: [12] as const,
  examples: ["281234567840"] as const,
  compact,
  format,
  validate,
  generate,
};

export default nss;
export { compact, format, validate, generate };
