/**
 * JMBG (Jedinstveni matični broj građana).
 *
 * Bosnian unique master citizen number. 13 digits
 * encoding DDMMYYY (7-digit birth year), region code,
 * serial number, and a check digit.
 *
 * @see https://en.wikipedia.org/wiki/Unique_Master_Citizen_Number
 */

import { weightedSum } from "#checksums/weighted-sum";
import { clean } from "#util/clean";
import { isValidDate } from "#util/date";
import { randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";

const WEIGHTS = [
  7, 6, 5, 4, 3, 2, 7, 6, 5, 4, 3, 2,
] as const;

const compact = (value: string): string =>
  clean(value, " -");

const resolveYear = (yyy: number): number =>
  yyy < 900 ? yyy + 2000 : yyy + 1000;

const calcCheckDigit = (v: string): number => {
  const total = weightedSum(v.slice(0, 12), WEIGHTS, 11);
  return ((11 - total) % 11) % 10;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 13) {
    return err(
      "INVALID_LENGTH",
      "JMBG must be exactly 13 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "JMBG must contain only digits",
    );
  }

  const dd = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const yyyy = resolveYear(Number(v.slice(4, 7)));
  if (!isValidDate(yyyy, mm, dd)) {
    return err(
      "INVALID_COMPONENT",
      "JMBG contains an invalid date",
    );
  }

  if (calcCheckDigit(v) !== Number(v[12])) {
    return err(
      "INVALID_CHECKSUM",
      "JMBG check digit does not match",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

const parse = (value: string): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const dd = Number(v.slice(0, 2));
  const mm = Number(v.slice(2, 4));
  const yyyy = resolveYear(Number(v.slice(4, 7)));

  const serial = Number(v.slice(9, 12));

  return {
    birthDate: new Date(yyyy, mm - 1, dd),
    gender: serial < 500 ? "male" : "female",
  };
};

/** Generate a random valid JMBG. */
const generate = (): string => {
  for (;;) {
    const dd = String(randomInt(1, 28)).padStart(2, "0");
    const mm = String(randomInt(1, 12)).padStart(2, "0");
    const yyy = String(randomInt(900, 999));
    const rr = String(randomInt(10, 99));
    const sss = String(randomInt(0, 999)).padStart(3, "0");
    const partial = dd + mm + yyy + rr + sss;
    const check = calcCheckDigit(partial);
    const c = partial + String(check);
    if (validate(c).valid) return c;
  }
};

/** Bosnian Unique Master Citizen Number. */
const jmbg: Validator<ParsedPersonId> = {
  name: "Bosnian Personal ID",
  localName: "Jedinstveni matični broj građana",
  abbreviation: "JMBG",
  aliases: ["JMBG", "matični broj"] as const,
  candidatePattern: "\\d{13}",
  country: "BA",
  entityType: "person",
  lengths: [13] as const,
  sourceUrl:
    "https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/",
  examples: ["0101006500006"] as const,
  compact,
  format,
  parse,
  validate,
  generate,
};

export default jmbg;
export { compact, format, parse, validate, generate };
