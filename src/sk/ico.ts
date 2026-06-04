/**
 * IČO (Identifikačné číslo organizácie).
 *
 * Slovak company identification number. Same
 * 8-digit weighted checksum as the Czech IČO.
 *
 * @see https://www.statistics.sk/
 */

import {
  compact,
  format,
  generate,
  validate,
} from "../cz/ico";
import type { CountryValidator } from "../types";

/** Slovak Company Identification Number. */
const ico: CountryValidator<"SK"> = {
  name: "Slovak Company ID",
  localName: "Identifikačné číslo organizácie",
  abbreviation: "IČO",
  aliases: [
    "IČO",
    "identifikačné číslo organizácie",
  ] as const,
  candidatePattern: "\\d{8}",
  scope: "country",
  country: "SK",
  entityType: "company",
  sourceUrl: "https://www.statistics.sk/",
  examples: ["25123891"] as const,
  compact,
  format,
  validate,
  generate,
};

export default ico;
export { compact, format, validate, generate };
