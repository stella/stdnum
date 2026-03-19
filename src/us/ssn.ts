/**
 * SSN (U.S. Social Security Number).
 *
 * 9-digit identifier: 3-digit area, 2-digit group,
 * 4-digit serial. No checksum. Area cannot be 000,
 * 666, or 900-999; group cannot be 00; serial
 * cannot be 0000.
 *
 * @see https://en.wikipedia.org/wiki/Social_Security_number
 * @see https://www.ssa.gov/employer/verifySSN.htm
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

const SSN_RE =
  /^(?<area>\d{3})-?(?<group>\d{2})-?(?<serial>\d{4})$/;

/** Known-invalid SSNs used in advertisements. */
const BLACKLIST = new Set([
  "078051120",
  "457555462",
  "219099999",
]);

const compact = (value: string): string =>
  clean(value, " -");

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "SSN must contain only digits",
    );
  }
  if (v.length !== 9) {
    return err("INVALID_LENGTH", "SSN must be 9 digits");
  }

  const match = SSN_RE.exec(v);
  if (!match) {
    return err(
      "INVALID_FORMAT",
      "SSN must match NNN-NN-NNNN pattern",
    );
  }

  const area = v.slice(0, 3);
  const group = v.slice(3, 5);
  const serial = v.slice(5, 9);

  if (area === "000" || area === "666" || area[0] === "9") {
    return err(
      "INVALID_COMPONENT",
      "SSN area number is invalid",
    );
  }
  if (group === "00") {
    return err(
      "INVALID_COMPONENT",
      "SSN group number cannot be 00",
    );
  }
  if (serial === "0000") {
    return err(
      "INVALID_COMPONENT",
      "SSN serial number cannot be 0000",
    );
  }
  if (BLACKLIST.has(v)) {
    return err(
      "INVALID_COMPONENT",
      "SSN is on the blacklist",
    );
  }

  return { valid: true, compact: v };
};

const format = (value: string): string => {
  const v = compact(value);
  if (v.length === 9) {
    return `${v.slice(0, 3)}-${v.slice(3, 5)}-${v.slice(5)}`;
  }
  return v;
};

/** U.S. Social Security Number. */
const ssn: Validator = {
  name: "Social Security Number",
  localName: "Social Security Number",
  abbreviation: "SSN",
  country: "US",
  entityType: "person",
  examples: ["536904399"] as const,
  compact,
  format,
  validate,
};

export default ssn;
export { compact, format, validate };
