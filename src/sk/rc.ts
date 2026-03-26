/**
 * RČ (Rodné číslo).
 *
 * Slovak birth number. Identical algorithm to
 * the Czech birth number.
 *
 * @see https://www.mvcr.cz/mvcren/docDetail.aspx?docid=21975362&doctype=ART
 * @see https://www.minv.sk/
 */

import {
  compact,
  format,
  generate,
  parse,
  validate,
} from "../cz/rc";
import type { ParsedPersonId, Validator } from "../types";

/** Slovak Birth Number. */
const rc: Validator<ParsedPersonId> = {
  name: "Slovak Birth Number",
  localName: "Rodné číslo",
  abbreviation: "RČ",
  aliases: ["rodné číslo", "RČ"] as const,
  candidatePattern: "\\d{6}/\\d{3,4}",
  country: "SK",
  entityType: "person",
  sourceUrl: "https://www.minv.sk/",
  lengths: [9, 10] as const,
  examples: ["7103192745"] as const,
  compact,
  format,
  generate,
  parse,
  validate,
};

export default rc;
export { compact, format, generate, parse, validate };
