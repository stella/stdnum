/**
 * TIN (Tax Identification Number, ՀԾՀ).
 *
 * Armenian taxpayer identification number issued by the
 * State Revenue Committee (SRC). 8 digits; the 8th digit
 * is a check digit calculated from the first 7. The
 * checksum algorithm is not publicly documented, so only
 * format validation is performed.
 *
 * Issued to both individuals and entities.
 *
 * @see https://www.oecd.org/tax/automatic-exchange/crs-implementation-and-assistance/tax-identification-numbers/Armenia-TIN.pdf
 * @see https://www.src.am/en/taxpayerSearchSystemPage/112
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const compact = (value: string): string =>
  clean(value, " -").trim();

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  if (v.length !== 8) {
    return err(
      "INVALID_LENGTH",
      "Armenian TIN must be 8 digits",
    );
  }

  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "Armenian TIN must contain only digits",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Armenian Tax Identification Number. */
const tin: Validator = {
  name: "Armenian Tax ID",
  localName: "Հարկ վճարողի հաշվառման համար",
  abbreviation: "TIN",
  country: "AM",
  entityType: "any",
  lengths: [8] as const,
  examples: ["01234561", "10048376"] as const,
  compact,
  format,
  validate,
  sourceUrl:
    "https://www.oecd.org/tax/automatic-exchange/"
    + "crs-implementation-and-assistance/"
    + "tax-identification-numbers/Armenia-TIN.pdf",
};

export default tin;
export { compact, format, validate };
