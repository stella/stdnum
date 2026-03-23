/**
 * UNP (Учётный номер плательщика, Belarus tax number).
 *
 * 9 characters: the first two identify the region (numeric
 * for organisations, letters from ABCEHKMOPT for
 * individuals), followed by 7 digits. The last digit is a
 * weighted check digit (mod 11; if remainder > 9 the
 * number is invalid).
 *
 * @see https://be.wikipedia.org/wiki/Уліковы_нумар_плацельшчыка
 * @see https://www.nalog.gov.by/
 */

import { clean } from "#util/clean";
import { randomDigits, randomInt } from "#util/generate";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

/** Cyrillic to Latin mapping for the letter positions. */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  А: "A",
  В: "B",
  Е: "E",
  К: "K",
  М: "M",
  Н: "H",
  О: "O",
  Р: "P",
  С: "C",
  Т: "T",
};

const WEIGHTS = [29, 23, 19, 17, 13, 7, 5, 3] as const;
const ALPHA_SET = "ABCEHKMOPT";
const VALID_FIRST = "1234567ABCEHKM";
const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

const compact = (value: string): string => {
  let v = clean(value, " ").toUpperCase().trim();
  if (v.startsWith("УНП")) {
    v = v.slice(3);
  } else if (v.startsWith("UNP")) {
    v = v.slice(3);
  }
  return [...v]
    .map((ch) => CYRILLIC_TO_LATIN[ch] ?? ch)
    .join("");
};

const calcCheckDigit = (number: string): number | null => {
  let work = number;
  if (!isdigits(number)) {
    const idx = ALPHA_SET.indexOf(number[1]!);
    if (idx === -1) return null;
    work = number[0] + String(idx) + number.slice(2);
  }
  let sum = 0;
  for (let i = 0; i < 8; i++) {
    const ch = work[i]!;
    const val = ALPHABET.indexOf(ch);
    if (val === -1) return null;
    sum += (WEIGHTS[i] ?? 0) * val;
  }
  const remainder = sum % 11;
  if (remainder > 9) return null;
  return remainder;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 9) {
    return err(
      "INVALID_LENGTH",
      "Belarus UNP must be 9 characters",
    );
  }
  if (!isdigits(v.slice(2))) {
    return err(
      "INVALID_FORMAT",
      "Belarus UNP positions 3-9 must be digits",
    );
  }
  const first2 = v.slice(0, 2);
  if (
    !isdigits(first2) &&
    ![...first2].every((ch) => ALPHA_SET.includes(ch))
  ) {
    return err(
      "INVALID_FORMAT",
      "Belarus UNP first two characters must be" +
        " digits or letters from ABCEHKMOPT",
    );
  }
  if (!VALID_FIRST.includes(v[0]!)) {
    return err(
      "INVALID_COMPONENT",
      "Belarus UNP has an invalid region prefix",
    );
  }
  const expected = calcCheckDigit(v);
  if (expected === null) {
    return err(
      "INVALID_CHECKSUM",
      "Belarus UNP check digit is invalid" +
        " (mod 11 remainder > 9)",
    );
  }
  if (v[8] !== String(expected)) {
    return err(
      "INVALID_CHECKSUM",
      "Belarus UNP check digit mismatch",
    );
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Generate a random valid Belarus UNP. */
const generate = (): string => {
  for (let i = 0; i < 100; i++) {
    const prefix = String(randomInt(1, 7));
    const rest = randomDigits(7);
    const payload = prefix + rest;
    const check = calcCheckDigit(payload);
    if (check === null) continue;
    const c = payload.slice(0, 8) + String(check);
    if (validate(c).valid) return c;
  }
  throw new Error("Failed to generate valid UNP");
};

/** Belarus UNP (Учётный номер плательщика). */
const unp: Validator = {
  name: "Belarus Tax Number",
  localName: "Учётный номер плательщика",
  abbreviation: "УНП",
  aliases: ["УНП", "UNP"] as const,
  candidatePattern: "\\d{9}",
  country: "BY",
  entityType: "any",
  sourceUrl: "https://www.nalog.gov.by/",
  examples: ["200988541", "MA1953684"] as const,
  compact,
  format,
  validate,
  generate,
};

export default unp;
export { compact, format, validate, generate };
