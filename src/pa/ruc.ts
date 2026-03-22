/**
 * RUC (Registro Único de Contribuyente, Panama
 * tax number).
 *
 * The RUC identifies taxpayers in Panama. It comes
 * in several formats depending on entity type
 * (natural person, legal entity, foreigner, etc.)
 * and is always accompanied by a two-digit check
 * code called the "dígito verificador" (DV).
 *
 * The DV is computed by encoding the hyphen-separated
 * RUC into a 20-position numeric buffer, then applying
 * a double weighted-sum mod 11 algorithm. The encoding
 * and legacy-format handling follow the official ANIP/DGI
 * specification.
 *
 * @see https://dgi.mef.gob.pa/
 */

import { clean } from "#util/clean";
import { randomInt } from "#util/generate";
import { err } from "#util/result";

import type { ValidateResult, Validator } from "../types";

/**
 * Legacy cross-reference table: maps two-digit codes
 * at positions 5–6 of old-format juridical RUCs.
 */
const LEGACY_MAP: Record<string, string> = {
  "00": "00",
  "10": "01",
  "11": "02",
  "12": "03",
  "13": "04",
  "14": "05",
  "15": "06",
  "16": "07",
  "17": "08",
  "18": "09",
  "19": "01",
  "20": "02",
  "21": "03",
  "22": "04",
  "23": "07",
  "24": "08",
  "25": "09",
  "26": "02",
  "27": "03",
  "28": "04",
  "29": "05",
  "30": "06",
  "31": "07",
  "32": "08",
  "33": "09",
  "34": "01",
  "35": "02",
  "36": "03",
  "37": "04",
  "38": "05",
  "39": "06",
  "40": "07",
  "41": "08",
  "42": "09",
  "43": "01",
  "44": "02",
  "45": "03",
  "46": "04",
  "47": "05",
  "48": "06",
  "49": "07",
};

/** Prepend n leading zeros. */
const z = (n: number): string =>
  "0".repeat(Math.max(0, n));

/**
 * Compute a single DV digit via weighted sum mod 11.
 * Weights start at 2 and increment, applied
 * right-to-left. For old-format juridical RUCs,
 * weight 12 is skipped (jumps from 11 to 13).
 */
const digitDV = (
  buf: string,
  isOldFormat: boolean,
): number => {
  let weight = 2;
  let sum = 0;
  for (let i = buf.length - 1; i >= 0; i--) {
    if (isOldFormat && weight === 12) {
      weight += 1; // skip 12, continue from 13
    }
    sum += weight * (buf.charCodeAt(i) - 48);
    weight += 1;
  }
  const r = sum % 11;
  return r > 1 ? 11 - r : 0;
};

/**
 * Encode the RUC segments into a numeric buffer
 * according to entity type, then compute the two
 * DV digits.
 *
 * Returns the two-digit DV string, or null if the
 * format is unrecognized.
 */
const computeDV = (
  segments: readonly string[],
  raw: string,
): string | null => {
  const len = segments.length;

  if (
    len < 3 ||
    len > 4 ||
    (len === 4 && segments[1] !== "NT")
  ) {
    return null;
  }

  let buf: string;
  let isOld = false;

  const s0 = segments[0]!;
  const s1 = segments[1]!;
  const s2 = segments[2]!;

  if (raw[0] === "E") {
    // Foreign person (E-xxx-xxx)
    buf =
      z(4 - s1.length) +
      "0000005" +
      "00" +
      "50" +
      z(3 - s1.length) +
      s1 +
      z(5 - s2.length) +
      s2;
  } else if (s1 === "NT") {
    // NT designation (xxNT-xxx-xxx)
    const s3 = segments[3]!;
    const prefix = s0.slice(0, -2);
    buf =
      z(4 - s1.length) +
      "0000005" +
      z(4 - prefix.length) +
      prefix +
      "43" +
      z(3 - s2.length) +
      s2 +
      z(5 - s3.length) +
      s3;
  } else if (s0.endsWith("AV")) {
    // AV suffix
    const prefix = s0.slice(0, -2);
    buf =
      z(4 - s1.length) +
      "0000005" +
      z(4 - prefix.length) +
      prefix +
      "15" +
      z(3 - s1.length) +
      s1 +
      z(5 - s2.length) +
      s2;
  } else if (s0.endsWith("PI")) {
    // PI suffix
    const prefix = s0.slice(0, -2);
    buf =
      z(4 - s1.length) +
      "0000005" +
      z(4 - prefix.length) +
      prefix +
      "79" +
      z(3 - s1.length) +
      s1 +
      z(5 - s2.length) +
      s2;
  } else if (s0 === "PE") {
    // PE prefix (foreign-born)
    buf =
      z(4 - s1.length) +
      "0000005" +
      "00" +
      "75" +
      z(3 - s1.length) +
      s1 +
      z(5 - s2.length) +
      s2;
  } else if (raw[0] === "N") {
    // N prefix (naturalized citizen)
    buf =
      z(4 - s1.length) +
      "0000005" +
      "00" +
      "40" +
      z(3 - s1.length) +
      s1 +
      z(5 - s2.length) +
      s2;
  } else if (s0.length >= 1 && s0.length <= 2) {
    // Natural person (province 1–2 digits)
    buf =
      z(4 - s1.length) +
      "0000005" +
      z(2 - s0.length) +
      s0 +
      "00" +
      z(3 - s1.length) +
      s1 +
      z(5 - s2.length) +
      s2;
  } else {
    // Juridical (company)
    buf =
      z(10 - s0.length) +
      s0 +
      z(4 - s1.length) +
      s1 +
      z(6 - s2.length) +
      s2;
    isOld =
      buf[3] === "0" &&
      buf[4] === "0" &&
      buf[5]! < "5";
  }

  // Apply legacy cross-reference for old format
  if (isOld) {
    const key = buf.slice(5, 7);
    const mapped = LEGACY_MAP[key] ?? key;
    buf = buf.slice(0, 5) + mapped + buf.slice(7);
  }

  const dv1 = digitDV(buf, isOld);
  const dv2 = digitDV(
    buf + String.fromCharCode(48 + dv1),
    isOld,
  );

  return `${dv1}${dv2}`;
};

/**
 * Compact: normalize Unicode, collapse whitespace,
 * strip colons around DV, and uppercase. Keeps
 * hyphens (structural separators) and a single
 * space before "DV".
 */
const compact = (value: string): string => {
  let v = clean(value, "").trim().toUpperCase();
  // Normalize DV portion: " DV: 49" -> " DV49"
  v = v.replace(
    /\s*DV[:\s]*(\d{2})$/,
    " DV$1",
  );
  // Collapse any remaining internal whitespace
  v = v.replace(/\s+/g, " ");
  return v;
};

const validate = (value: string): ValidateResult => {
  const v = compact(value);

  // Extract the DV portion: "...DV49", "...DV:49",
  // or "... DV 49"
  const dvMatch = v.match(
    /^(.+?)-?\s*DV[:\s]*(\d{2})$/,
  );

  if (!dvMatch) {
    return err(
      "INVALID_FORMAT",
      "Panama RUC must include DV " +
        "(dígito verificador)",
    );
  }

  const rucPart = dvMatch[1]!;
  const dvPart = dvMatch[2]!;

  // The RUC part should be hyphen-separated segments
  const segments = rucPart
    .replace(/-+$/, "")
    .split("-");

  if (segments.length < 3 || segments.length > 4) {
    return err(
      "INVALID_FORMAT",
      "Panama RUC must have 3–4 " +
        "hyphen-separated segments",
    );
  }

  if (segments.some((s) => s.length === 0)) {
    return err(
      "INVALID_FORMAT",
      "Panama RUC segments must not be empty",
    );
  }

  const computed = computeDV(segments, rucPart);
  if (computed === null) {
    return err(
      "INVALID_FORMAT",
      "Unrecognized Panama RUC format",
    );
  }

  if (computed !== dvPart) {
    return err(
      "INVALID_CHECKSUM",
      "Panama RUC dígito verificador " +
        "does not match",
    );
  }

  const compactForm =
    segments.join("-") + " DV" + dvPart;
  return { valid: true, compact: compactForm };
};

/**
 * Format: display as segments with " DV XX".
 */
const format = (value: string): string => {
  const v = compact(value);
  const dvMatch = v.match(
    /^(.+?)-?\s*DV[:\s]*(\d{2})$/,
  );
  if (!dvMatch) return v;

  const rucPart = dvMatch[1]!.replace(/-+$/, "");
  const dvPart = dvMatch[2]!;
  const segments = rucPart.split("-");
  return `${segments.join("-")} DV ${dvPart}`;
};

/** Generate a random valid Panama RUC (natural person). */
const generate = (): string => {
  const province = String(randomInt(1, 13));
  const volume = String(randomInt(1, 9999));
  const folio = String(randomInt(1, 99999));
  const segments = [province, volume, folio];
  const dv = computeDV(
    segments,
    segments.join("-"),
  )!;
  return `${segments.join("-")}DV${dv}`;
};

/** Panama tax identification number. */
const ruc: Validator = {
  name: "Tax Identification Number",
  localName: "Registro Único de Contribuyente",
  abbreviation: "RUC",
  aliases: ["RUC"] as const,
  candidatePattern:
    "\\d{1,2}-?\\d{1,4}-?\\d{1,6}",
  country: "PA",
  entityType: "any",
  description:
    "Tax identifier issued by Panama's DGI",
  sourceUrl: "https://dgi.mef.gob.pa/",
  examples: [
    "1-184-921 DV49",
    "2588017-1-831938 DV20",
  ] as const,
  compact,
  format,
  validate,
  generate,
};

export default ruc;
export { compact, format, validate, generate };
