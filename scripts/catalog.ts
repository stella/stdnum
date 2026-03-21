/**
 * Auto-generated validator catalog.
 *
 * Discovers all validators from the src/index barrel,
 * collects their metadata, and prints a formatted table
 * grouped by country. Pass --json for machine-readable
 * output.
 *
 * Usage:
 *   bun scripts/catalog.ts
 *   bun scripts/catalog.ts --json
 */

import * as all from "../src";
import type {
  CountryCode,
  Validator,
} from "../src/types";

// ─── Country name lookup ────────────────────

const COUNTRY_NAMES: Record<CountryCode, string> = {
  AT: "Austria",
  BE: "Belgium",
  BG: "Bulgaria",
  CH: "Switzerland",
  CN: "China",
  CY: "Cyprus",
  CZ: "Czechia",
  DE: "Germany",
  DK: "Denmark",
  EE: "Estonia",
  EG: "Egypt",
  ES: "Spain",
  FI: "Finland",
  FR: "France",
  GB: "United Kingdom",
  GE: "Georgia",
  GH: "Ghana",
  GR: "Greece",
  HR: "Croatia",
  HU: "Hungary",
  IE: "Ireland",
  IL: "Israel",
  IN: "India",
  IS: "Iceland",
  IT: "Italy",
  JP: "Japan",
  KR: "South Korea",
  KZ: "Kazakhstan",
  LT: "Lithuania",
  LU: "Luxembourg",
  LV: "Latvia",
  MT: "Malta",
  MX: "Mexico",
  NL: "Netherlands",
  NO: "Norway",
  NZ: "New Zealand",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  RS: "Serbia",
  RU: "Russia",
  SE: "Sweden",
  SI: "Slovenia",
  SK: "Slovakia",
  TR: "Turkey",
  UA: "Ukraine",
  US: "United States",
  ZA: "South Africa",
  CA: "Canada",
  AU: "Australia",
  BR: "Brazil",
  AR: "Argentina",
  CL: "Chile",
  PE: "Peru",
  HK: "Hong Kong",
  ID: "Indonesia",
  PK: "Pakistan",
  CO: "Colombia",
  EC: "Ecuador",
  TW: "Taiwan",
  DO: "Dominican Republic",
  UY: "Uruguay",
  VE: "Venezuela",
  LI: "Liechtenstein",
  MA: "Morocco",
  MC: "Monaco",
  MD: "Moldova",
  BA: "Bosnia and Herzegovina",
  ME: "Montenegro",
  MK: "North Macedonia",
  MY: "Malaysia",
  SG: "Singapore",
  TH: "Thailand",
  AZ: "Azerbaijan",
  CR: "Costa Rica",
  CU: "Cuba",
  AD: "Andorra",
  AL: "Albania",
  AM: "Armenia",
  BY: "Belarus",
  GT: "Guatemala",
  NI: "Nicaragua",
  PA: "Panama",
};

// ─── Validator entry ────────────────────────

type CatalogEntry = {
  key: string;
  country: CountryCode | undefined;
  name: string;
  localName: string;
  abbreviation: string;
  entityType: "person" | "company" | "any";
  examplesCount: number;
};

// ─── Auto-discover validators ───────────────

const isValidator = (v: unknown): v is Validator =>
  v !== null &&
  typeof v === "object" &&
  "validate" in v &&
  "compact" in v &&
  "format" in v &&
  "name" in v;

const entries: CatalogEntry[] = [];

for (const [ns, mod] of Object.entries(all)) {
  if (isValidator(mod)) {
    entries.push({
      key: ns,
      country: mod.country,
      name: mod.name,
      localName: mod.localName,
      abbreviation: mod.abbreviation,
      entityType: mod.entityType,
      examplesCount: mod.examples?.length ?? 0,
    });
  } else if (mod && typeof mod === "object") {
    for (const [key, v] of Object.entries(
      // SAFETY: namespace re-exports are plain objects;
      // Object.entries returns unknown values regardless.
      mod as Record<string, unknown>,
    )) {
      if (isValidator(v)) {
        entries.push({
          key: `${ns}.${key}`,
          country: v.country,
          name: v.name,
          localName: v.localName,
          abbreviation: v.abbreviation,
          entityType: v.entityType,
          examplesCount: v.examples?.length ?? 0,
        });
      }
    }
  }
}

// ─── Group by country ───────────────────────

const INTERNATIONAL = "__intl__" as const;
type GroupKey = CountryCode | typeof INTERNATIONAL;

const grouped = new Map<GroupKey, CatalogEntry[]>();

for (const entry of entries) {
  const group: GroupKey =
    entry.country ?? INTERNATIONAL;
  const list = grouped.get(group);
  if (list) {
    list.push(entry);
  } else {
    grouped.set(group, [entry]);
  }
}

// Sort groups: international first, then alphabetically
const sortedGroups = [...grouped.keys()].sort(
  (a, b) => {
    if (a === INTERNATIONAL) return -1;
    if (b === INTERNATIONAL) return 1;
    return a.localeCompare(b);
  },
);

// ─── Output ─────────────────────────────────

const jsonMode = process.argv.includes("--json");

if (jsonMode) {
  const output = {
    validators: entries.map((e) => ({
      key: e.key,
      country: e.country ?? null,
      name: e.name,
      localName: e.localName,
      abbreviation: e.abbreviation,
      entityType: e.entityType,
      examplesCount: e.examplesCount,
    })),
    summary: {
      total: entries.length,
      countries: new Set(
        entries
          .map((e) => e.country)
          .filter(Boolean),
      ).size,
      byEntityType: {
        person: entries.filter(
          (e) => e.entityType === "person",
        ).length,
        company: entries.filter(
          (e) => e.entityType === "company",
        ).length,
        any: entries.filter(
          (e) => e.entityType === "any",
        ).length,
      },
    },
  };
  console.log(JSON.stringify(output, null, 2));
} else {
  console.log("@stll/stdnum — Validator Catalog");
  console.log("================================");
  console.log();

  // Compute column widths for alignment
  const keyWidth = Math.max(
    ...entries.map((e) => {
      const part = e.key.split(".").pop() ?? e.key;
      return part.length;
    }),
    4,
  );
  const nameWidth = Math.max(
    ...entries.map(
      (e) => `${e.name} (${e.abbreviation})`.length,
    ),
    10,
  );
  const typeWidth = Math.max(
    ...entries.map((e) => e.entityType.length),
    4,
  );

  for (const group of sortedGroups) {
    const items = grouped.get(group);
    if (!items) continue;

    if (group === INTERNATIONAL) {
      console.log("International");
    } else {
      const label = COUNTRY_NAMES[group];
      console.log(`${group} (${label})`);
    }

    for (const entry of items) {
      const keyPart =
        entry.key.split(".").pop() ?? entry.key;
      const nameLabel =
        `${entry.name} (${entry.abbreviation})`;
      const line = [
        "  ",
        keyPart.padEnd(keyWidth + 2),
        nameLabel.padEnd(nameWidth + 2),
        entry.entityType.padEnd(typeWidth + 2),
        `${entry.examplesCount} example${entry.examplesCount !== 1 ? "s" : ""}`,
      ].join("");
      console.log(line);
    }

    console.log();
  }

  // Summary
  const countries = new Set(
    entries.map((e) => e.country).filter(Boolean),
  ).size;
  const personCount = entries.filter(
    (e) => e.entityType === "person",
  ).length;
  const companyCount = entries.filter(
    (e) => e.entityType === "company",
  ).length;
  const anyCount = entries.filter(
    (e) => e.entityType === "any",
  ).length;

  console.log(
    `Summary: ${entries.length} validators across ` +
      `${countries} countries`,
  );
  console.log(
    `  Person: ${personCount} | ` +
      `Company: ${companyCount} | ` +
      `Any: ${anyCount}`,
  );
}
