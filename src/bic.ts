/**
 * BIC (Business Identifier Code).
 *
 * ISO 9362. 8 or 11 character code identifying
 * financial institutions. Format:
 * [A-Z]{4} (institution) + [A-Z]{2} (country) +
 * [0-9A-Z]{2} (location) + [0-9A-Z]{3} (branch,
 * optional).
 *
 * @see https://www.swift.com/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "./types";

/**
 * ISO 3166-1 alpha-2 country codes.
 * Covers all SWIFT-participating countries.
 */
const COUNTRIES = new Set([
  // EU-27
  "AT",
  "BE",
  "BG",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GR",
  "HR",
  "HU",
  "IE",
  "IT",
  "LT",
  "LU",
  "LV",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SE",
  "SI",
  "SK",
  // EEA + common
  "CH",
  "NO",
  "IS",
  "LI",
  "GB",
  "US",
  "JP",
  "CN",
  "AU",
  "CA",
  "NZ",
  "HK",
  "SG",
  "IN",
  "BR",
  "KR",
  "ZA",
  "MX",
  "AE",
  "SA",
  "TR",
  "RU",
  "IL",
  "TH",
  "MY",
  "ID",
  "PH",
  "TW",
  "VN",
  "CL",
  "CO",
  "AR",
  "PE",
  "KE",
  "NG",
  "GH",
  "EG",
  "MA",
  "TN",
  "PK",
  "BD",
  "LK",
  "QA",
  "BH",
  "KW",
  "OM",
  "JO",
  "LB",
  "UA",
  "KZ",
  "GE",
  "RS",
  "BA",
  "MK",
  "ME",
  "AL",
  "XK",
  "MD",
  "BY",
  "AM",
  "AZ",
  "UZ",
  "MN",
  "MM",
  "KH",
  "LA",
  "NP",
  "PA",
  "CR",
  "DO",
  "GT",
  "HN",
  "SV",
  "NI",
  "JM",
  "TT",
  "BB",
  "BS",
  "BM",
  "KY",
  "CW",
  "AW",
  "MU",
  "SC",
  "FJ",
  "PG",
  "WS",
]);

const BIC_RE =
  /^[A-Z]{4}[A-Z]{2}[0-9A-Z]{2}([0-9A-Z]{3})?$/;

const compact = (value: string): string =>
  clean(value, " -").toUpperCase();

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 8 && v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "BIC must be 8 or 11 characters",
    );
  }
  if (!BIC_RE.test(v)) {
    return err(
      "INVALID_FORMAT",
      "BIC must match [A-Z]{4}[A-Z]{2}[0-9A-Z]{2,5}",
    );
  }
  const cc = v.slice(4, 6);
  if (!COUNTRIES.has(cc)) {
    return err(
      "INVALID_COMPONENT",
      `Unknown country code: ${cc}`,
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 11) {
    return `${v.slice(0, 4)} ${v.slice(4, 6)} ${v.slice(6, 8)} ${v.slice(8)}`;
  }
  return `${v.slice(0, 4)} ${v.slice(4, 6)} ${v.slice(6)}`;
};

/** Business Identifier Code (SWIFT/BIC). */
const bic: Validator = {
  name: "Business Identifier Code",
  localName: "Business Identifier Code",
  abbreviation: "BIC",
  entityType: "company",
  compact,
  format,
  validate,
};

export default bic;
export { compact, format, validate };
