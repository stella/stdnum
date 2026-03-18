/**
 * RČ (Rodné číslo).
 *
 * Slovak birth number. Identical algorithm to
 * the Czech birth number.
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
  compact,
  format,
  validate,
};

export default rc;
export { compact, format, parse, validate };
