/**
 * MST (Mã số thuế, Vietnam tax number).
 *
 * 10 or 13 digits. The first two digits encode the province
 * where the business was registered. Digits 3-9 are a
 * sequential number (0000001-9999999). Digit 10 is a
 * weighted mod-11 check digit. An optional 3-digit branch
 * suffix (001-999) may follow, separated by a dash.
 *
 * @see https://vi.wikipedia.org/wiki/Thuế_Việt_Nam#Mã_số_thuế_(MST)_của_doanh_nghiệp
 * @see https://easyinvoice.vn/ma-so-thue/
 */

import { clean } from "#util/clean";
import { randomDigits, randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const WEIGHTS = [31, 29, 23, 19, 17, 13, 7, 5, 3] as const;

const calcCheckDigit = (number: string): string => {
  let total = 0;
  for (let i = 0; i < 9; i++) {
    total += (WEIGHTS[i] ?? 0) * Number(number.charAt(i));
  }
  const remainder = 10 - (total % 11);
  // When remainder is 10, the sequential part is
  // never issued by GDT. Returning "0" keeps the
  // function correct as a digit calculator (mod 10
  // wrap) while still rejecting these numbers since
  // no real MST will have this combination.
  return String(
    remainder >= 10 ? remainder - 10 : remainder,
  );
};

const compact = (value: string): string =>
  clean(value, " -.");

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 10 && v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "MST must be 10 or 13 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "MST must contain only digits",
    );
  }

  // Sequential part (digits 3-9) must not be all zeros
  if (v.slice(2, 9) === "0000000") {
    return err(
      "INVALID_COMPONENT",
      "MST sequential part must not be 0000000",
    );
  }

  // Branch suffix (last 3 digits) must not be 000
  if (v.length === 13 && v.slice(10) === "000") {
    return err(
      "INVALID_COMPONENT",
      "MST branch suffix must not be 000",
    );
  }

  // Check digit (position 10, index 9)
  if (v[9] !== calcCheckDigit(v)) {
    return err(
      "INVALID_CHECKSUM",
      "MST check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 13) {
    return `${v.slice(0, 10)}-${v.slice(10)}`;
  }
  return v;
};

/** Generate a random valid Vietnamese MST. */
const generate = (): string => {
  for (;;) {
    const province = String(randomInt(1, 99)).padStart(
      2,
      "0",
    );
    const payload = province + randomDigits(7);
    const c = payload + calcCheckDigit(payload);
    if (validate(c).valid) return c;
  }
};

/** Vietnamese Tax Number. */
const mst: Validator = {
  name: "Vietnamese Tax Number",
  localName: "Mã số thuế",
  abbreviation: "MST",
  aliases: ["MST", "mã số thuế"] as const,
  candidatePattern: "\\d{10}(-\\d{3})?",
  country: "VN",
  entityType: "company",
  description:
    "10- or 13-digit tax identifier for enterprises",
  sourceUrl:
    "https://vi.wikipedia.org/wiki/Thu%E1%BA%BF_Vi%E1%BB%87t_Nam#M%C3%A3_s%E1%BB%91_thu%E1%BA%BF_(MST)_c%E1%BB%A7a_doanh_nghi%E1%BB%87p",
  lengths: [10, 13] as const,
  examples: ["0100233488", "0314409058002"] as const,
  compact,
  format,
  validate,
  generate,
};

export default mst;
export { compact, format, validate, generate };
