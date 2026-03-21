/**
 * PESEL (Powszechny Elektroniczny System
 * Ewidencji Ludności).
 *
 * Polish national identification number.
 * 11 digits encoding date of birth, serial
 * number, gender, and a check digit.
 *
 * @see https://www.oecd.org/content/dam/oecd/en/topics/policy-issue-focus/aeoi/poland-tin.pdf
 * @see https://www.gov.pl/web/cyfryzacja/numer-pesel
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";

const WEIGHTS = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3] as const;

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 11) {
    return err(
      "INVALID_LENGTH",
      "PESEL must be exactly 11 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "PESEL must contain only digits",
    );
  }

  const yy = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const dd = Number(v.slice(4, 6));

  // Century encoding via month offset
  let century: number;
  if (mm >= 81 && mm <= 92) {
    century = 1800;
  } else if (mm >= 1 && mm <= 12) {
    century = 1900;
  } else if (mm >= 21 && mm <= 32) {
    century = 2000;
  } else if (mm >= 41 && mm <= 52) {
    century = 2100;
  } else if (mm >= 61 && mm <= 72) {
    century = 2200;
  } else {
    return err(
      "INVALID_COMPONENT",
      "PESEL contains an invalid month",
    );
  }

  const year = century + yy;
  const month = mm % 20;
  if (!isValidDate(year, month, dd)) {
    return err(
      "INVALID_COMPONENT",
      "PESEL contains an invalid date",
    );
  }

  const sum = weightedSum(v.slice(0, 10), WEIGHTS, 10);
  const check = (10 - sum) % 10;
  if (check !== Number(v[10])) {
    return err(
      "INVALID_CHECKSUM",
      "PESEL check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/**
 * Extract birth date and gender from a PESEL number.
 * Returns null if the value is not valid.
 */
const parse = (
  value: string,
): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const yy = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const dd = Number(v.slice(4, 6));
  const serial = Number(v[9]);

  let century: number;
  if (mm >= 81) century = 1800;
  else if (mm <= 12) century = 1900;
  else if (mm <= 32) century = 2000;
  else if (mm <= 52) century = 2100;
  else century = 2200;

  return {
    birthDate: new Date(century + yy, (mm % 20) - 1, dd),
    gender: serial % 2 === 0 ? "female" : "male",
  };
};

/** Polish National Identification Number. */
const pesel: Validator = {
  name: "Polish National ID",
  localName:
    "Powszechny Elektroniczny System Ewidencji Ludności",
  abbreviation: "PESEL",
  aliases: ["PESEL"] as const,
  candidatePattern: "\\d{11}",
  country: "PL",
  entityType: "person",
  sourceUrl: 
    "https://www.gov.pl/web/cyfryzacja/numer-pesel",
  examples: ["02070803628"] as const,
  compact,
  format,
  validate,
};

export default pesel;
export { compact, format, parse, validate };
