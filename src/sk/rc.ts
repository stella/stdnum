/**
 * RČ (Rodné číslo).
 *
 * Slovak birth number. Identical algorithm to
 * the Czech birth number.
 *
 * @see https://www.mvcr.cz/mvcren/docDetail.aspx?docid=21975362&doctype=ART
 * @see https://www.minv.sk/
 */

import { compact, format, parse, validate } from "../cz/rc";
import type { Validator } from "../types";

/** Slovak Birth Number. */
const rc: Validator = {
  name: "Slovak Birth Number",
  localName: "Rodné číslo",
  abbreviation: "RČ",
  country: "SK",
  entityType: "person",
  sourceUrl: "https://www.minv.sk/",
  examples: ["7103192745"] as const,
  compact,
  format,
  validate,
};

export default rc;
export { compact, format, parse, validate };
