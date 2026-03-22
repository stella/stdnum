/** Generate a random valid U.S. EIN. */
const generate = (): string => {
  const prefixes = [
    "01", "02", "03", "04", "05", "06",
    "10", "11", "12", "13", "14", "15", "16",
    "20", "21", "22", "23", "24", "25", "26", "27",
    "30", "31", "32", "33", "34", "35", "36", "37",
    "38", "39", "40", "41", "42", "43", "44", "45",
    "46", "47", "48", "50", "51", "52", "53", "54",
    "55", "56", "57", "58", "59", "60", "61", "62",
    "63", "64", "65", "66", "67", "68", "71", "72",
    "73", "74", "75", "76", "77", "80", "81", "82",
    "83", "84", "85", "86", "87", "88", "90", "91",
    "92", "93", "94", "95", "98", "99",
  ];
  const prefix =
    prefixes[randomInt(0, prefixes.length - 1)]!;
  return prefix + randomDigits(7);
};

/**
 * EIN (U.S. Employer Identification Number).
 *
 * 9-digit identifier: 2-digit campus prefix +
 * 7-digit group. No checksum. The first 2 digits
 * must be a valid IRS campus code.
 *
 * @see https://en.wikipedia.org/wiki/Employer_Identification_Number
 * @see https://www.irs.gov/businesses/small-businesses-self-employed/how-eins-are-assigned-and-valid-ein-prefixes
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";
import { randomDigits, randomInt } from "#util/generate";

import type { ValidateResult, Validator } from "../types";

/**
 * Valid EIN campus prefixes. Sourced from IRS
 * documentation and python-stdnum's numdb.
 */
const VALID_PREFIXES = new Set([
  "01",
  "02",
  "03",
  "04",
  "05",
  "06",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "50",
  "51",
  "52",
  "53",
  "54",
  "55",
  "56",
  "57",
  "58",
  "59",
  "60",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "67",
  "68",
  "71",
  "72",
  "73",
  "74",
  "75",
  "76",
  "77",
  "80",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "90",
  "91",
  "92",
  "93",
  "94",
  "95",
  "98",
  "99",
]);

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "EIN must contain only digits",
    );
  }
  if (v.length !== 9) {
    return err("INVALID_LENGTH", "EIN must be 9 digits");
  }
  const prefix = v.slice(0, 2);
  if (!VALID_PREFIXES.has(prefix)) {
    return err(
      "INVALID_COMPONENT",
      "EIN campus prefix is invalid",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 9) {
    return `${v.slice(0, 2)}-${v.slice(2)}`;
  }
  return v;
};

/** U.S. Employer Identification Number. */
const ein: Validator = {
  name: "Employer Identification Number",
  localName: "Employer Identification Number",
  abbreviation: "EIN",
  aliases: [
    "EIN",
    "Employer Identification Number",
    "Federal Tax ID",
  ] as const,
  candidatePattern: "\\d{2}-?\\d{7}",
  country: "US",
  entityType: "company",
  sourceUrl: 
    "https://www.irs.gov/businesses/small-businesses-self-employed/how-eins-are-assigned-and-valid-ein-prefixes",
  examples: ["042103594"] as const,
  compact,
  format,
  validate,
  generate,
};

export default ein;
export { compact, format, validate, generate };
