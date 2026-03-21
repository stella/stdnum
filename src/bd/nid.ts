/**
 * NID (জাতীয় পরিচয়পত্র, Bangladesh National ID).
 *
 * Two formats exist:
 * - 13 digits (old): DD-R-PP-UU-SSSSSS where
 *   DD = district, R = residential type (RMO),
 *   PP = police station, UU = union/ward code,
 *   SSSSSS = serial number.
 * - 17 digits (new): YYYY + 13-digit old format
 *   where YYYY is the year of birth.
 * - 10 digits (smart card): a newer format issued
 *   on smart NID cards; no public structural spec
 *   beyond digit-only validation.
 *
 * No checksum algorithm is used. Validation is
 * structural: length, digit-only, and a valid
 * RMO code (residential type).
 *
 * @see https://en.wikipedia.org/wiki/National_identity_card_(Bangladesh)
 * @see https://www.nidw.gov.bd/
 */

import { clean } from "#util/clean";
import { err } from "#util/result";
import { isdigits } from "#util/strings";

import type { ValidateResult, Validator } from "../types";

/**
 * Valid RMO (residential/municipal/other) codes.
 * 1 = Rural, 2 = Municipality, 3 = City,
 * 4 = Others, 5 = Cantonment, 9 = City Corporation.
 */
const VALID_RMO = new Set(["1", "2", "3", "4", "5", "9"]);

const compact = (value: string): string =>
  clean(value, " -");

/**
 * Validate the 13-digit core (without year prefix).
 * Returns an error result or null on success.
 */
const validateCore = (
  core: string,
): ValidateResult | null => {
  // core[0..1] = district (any 2 digits)
  // core[2] = RMO code
  const rmo = core[2];
  if (rmo === undefined || !VALID_RMO.has(rmo)) {
    return err(
      "INVALID_COMPONENT",
      "NID residential type (RMO) code is invalid",
    );
  }
  return null;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);
  if (v.length !== 10 && v.length !== 13 && v.length !== 17) {
    return err(
      "INVALID_LENGTH",
      "NID must be 10, 13, or 17 digits",
    );
  }
  if (!isdigits(v)) {
    return err(
      "INVALID_FORMAT",
      "NID must contain only digits",
    );
  }
  if (v.length === 10) {
    // Smart card format: first digit must not be 0
    if (v[0] === "0") {
      return err(
        "INVALID_COMPONENT",
        "NID smart card number must not start with 0",
      );
    }
    return { valid: true, compact: v };
  }
  // 13-digit (old) or 17-digit (new) format
  const core = v.length === 17 ? v.slice(4) : v;
  const coreErr = validateCore(core);
  if (coreErr !== null) {
    return coreErr;
  }
  return { valid: true, compact: v };
};

const format = (value: string): string => compact(value);

/** Bangladesh National Identity Number. */
const nid: Validator = {
  name: "National Identity Number",
  localName: "জাতীয় পরিচয়পত্র",
  abbreviation: "NID",
  aliases: ["NID", "জাতীয় পরিচয়পত্র", "National ID Card"] as const,
  candidatePattern: "\\d{10,17}",
  country: "BD",
  entityType: "person",
  lengths: [10, 13, 17],
  examples: [
    "1592824588424",
    "19841592824588424",
    "2610413965404",
    "19892610413965404",
  ] as const,
  description:
    "National identity number issued by the " +
    "Bangladesh Election Commission",
  sourceUrl: "https://www.nidw.gov.bd/",
  compact,
  format,
  validate,
};

export default nid;
export { compact, format, validate };
