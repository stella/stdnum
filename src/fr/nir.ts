/**
 * NIR (Numero d'Inscription au Repertoire).
 *
 * French social security number (numero de securite
 * sociale). 15 digits: 13 identity digits + 2 check
 * digits. Encodes gender, year/month of birth, and
 * department of birth.
 *
 * Corsican departments 2A/2B are encoded as 19/18
 * for the mod-97 checksum computation.
 *
 * @see https://en.wikipedia.org/wiki/INSEE_code
 */

import { clean } from "#util/clean";
import { resolveTwoDigitYear } from "#util/date";
import { randomInt } from "#util/generate";
import { err } from "#util/result";

import type {
  ParsedPersonId,
  ValidateResult,
  Validator,
} from "../types";

const compact = (value: string): string =>
  clean(value, " -.");

const validate = (value: string): ValidateResult => {
  const v = compact(value).toUpperCase();
  if (v.length !== 15) {
    return err(
      "INVALID_LENGTH",
      "French NIR must be 15 characters",
    );
  }

  const gender = v[0];
  if (gender !== "1" && gender !== "2") {
    return err(
      "INVALID_COMPONENT",
      "French NIR first digit must be 1 or 2",
    );
  }

  const yearPart = v.slice(1, 3);
  if (!/^\d{2}$/.test(yearPart)) {
    return err(
      "INVALID_FORMAT",
      "French NIR year must be 2 digits",
    );
  }

  const monthPart = v.slice(3, 5);
  if (!/^\d{2}$/.test(monthPart) || monthPart === "00") {
    return err(
      "INVALID_FORMAT",
      "French NIR month must be 01-99",
    );
  }

  const deptPart = v.slice(5, 7);
  const isCorsica = deptPart === "2A" || deptPart === "2B";
  if (!isCorsica && !/^\d{2}$/.test(deptPart)) {
    return err(
      "INVALID_FORMAT",
      "French NIR department must be 2 digits or 2A/2B",
    );
  }

  const communePart = v.slice(7, 10);
  if (!/^\d{3}$/.test(communePart)) {
    return err(
      "INVALID_FORMAT",
      "French NIR commune must be 3 digits",
    );
  }

  const serialPart = v.slice(10, 13);
  if (!/^\d{3}$/.test(serialPart)) {
    return err(
      "INVALID_FORMAT",
      "French NIR serial must be 3 digits",
    );
  }

  const checkPart = v.slice(13, 15);
  if (!/^\d{2}$/.test(checkPart)) {
    return err(
      "INVALID_FORMAT",
      "French NIR check must be 2 digits",
    );
  }

  let numericBase: string;
  if (deptPart === "2A") {
    numericBase = v.slice(0, 5) + "19" + v.slice(7, 13);
  } else if (deptPart === "2B") {
    numericBase = v.slice(0, 5) + "18" + v.slice(7, 13);
  } else {
    numericBase = v.slice(0, 13);
  }

  const base = BigInt(numericBase);
  const expected = 97n - (base % 97n);
  const actual = BigInt(checkPart);

  if (expected !== actual) {
    return err(
      "INVALID_CHECKSUM",
      "French NIR check digits mismatch",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value).toUpperCase();
  return (
    `${v.slice(0, 1)} ${v.slice(1, 3)}` +
    ` ${v.slice(3, 5)} ${v.slice(5, 7)}` +
    ` ${v.slice(7, 10)} ${v.slice(10, 13)}` +
    ` ${v.slice(13)}`
  );
};

const parse = (value: string): ParsedPersonId | null => {
  const result = validate(value);
  if (!result.valid) return null;

  const v = result.compact;
  const genderDigit = v[0];
  const yy = Number(v.slice(1, 3));
  const mm = Number(v.slice(3, 5));

  if (mm < 1 || mm > 12) return null;

  const year = resolveTwoDigitYear(yy);
  const gender = genderDigit === "1" ? "male" : "female";

  return {
    birthDate: new Date(year, mm - 1, 1),
    gender,
  };
};

/** Generate a random valid French NIR. */
const generate = (): string => {
  for (;;) {
    const g = String(randomInt(1, 2));
    const yy = String(randomInt(50, 99)).padStart(2, "0");
    const mm = String(randomInt(1, 12)).padStart(2, "0");
    const dept = String(randomInt(1, 95)).padStart(2, "0");
    const com = String(randomInt(1, 999)).padStart(3, "0");
    const s = String(randomInt(1, 999)).padStart(3, "0");
    const base = g + yy + mm + dept + com + s;
    const check = String(97 - (Number(base) % 97)).padStart(
      2,
      "0",
    );
    const c = base + check;
    if (validate(c).valid) return c;
  }
};

/** French Social Security Number. */
const nir: Validator<ParsedPersonId> = {
  name: "French Social Security Number",
  localName: "Numero d'Inscription au Repertoire",
  abbreviation: "NIR",
  aliases: [
    "NIR",
    "numéro de sécurité sociale",
    "numéro SS",
    "sécu",
  ] as const,
  candidatePattern:
    "[12]\\s?\\d{2}\\s?\\d{2}\\s?\\d{2}\\s?\\d{3}\\s?\\d{3}\\s?\\d{2}",
  country: "FR",
  entityType: "person",
  description:
    "French social security number encoding " +
    "gender, birth date, and department",
  sourceUrl: "https://en.wikipedia.org/wiki/INSEE_code",
  lengths: [15] as const,
  examples: ["295117823456784"] as const,
  compact,
  format,
  parse,
  validate,
  generate,
};

export default nir;
export { compact, format, parse, validate, generate };
