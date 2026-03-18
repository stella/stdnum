/**
 * IČO (Identifikačné číslo organizácie).
 *
 * Slovak company identification number. Same
 * 8-digit weighted checksum as the Czech IČO.
 *
 * @see https://www.statistics.sk/
 */

import { compact, format, validate } from "../cz/ico";
import type { Validator } from "../types";

/** Slovak Company Identification Number. */
const ico: Validator = {
  name: "Slovak Company ID",
  localName: "Identifikačné číslo organizácie",
  abbreviation: "IČO",
  country: "SK",
  entityType: "company",
  compact,
  format,
  validate,
};

export default ico;
export { compact, format, validate };
