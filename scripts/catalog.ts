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
import type { Validator } from "../src/types";

// ─── Country name lookup ────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  AT: "Austria",
  BE: "Belgium",
  BG: "Bulgaria",
  CH: "Switzerland",
  CY: "Cyprus",
  CZ: "Czechia",
  DE: "Germany",
  DK: "Denmark",
  EE: "Estonia",
  ES: "Spain",
  EU: "European Union",
  FI: "Finland",
  FR: "France",
  GB: "United Kingdom",
  GR: "Greece",
  HR: "Croatia",
  HU: "Hungary",
  IE: "Ireland",
  IS: "Iceland",
  IT: "Italy",
  LT: "Lithuania",
  LU: "Luxembourg",
  LV: "Latvia",
  MT: "Malta",
  NL: "Netherlands",
  NO: "Norway",
  PL: "Poland",
  PT: "Portugal",
  RO: "Romania",
  SE: "Sweden",
  SI: "Slovenia",
  SK: "Slovakia",
};

// ─── Validator entry ────────────────────────

type CatalogEntry = {
  key: string;
  country: string | undefined;
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

const INTERNATIONAL = "__intl__";

const grouped = new Map<string, CatalogEntry[]>();

for (const entry of entries) {
  const group = entry.country ?? INTERNATIONAL;
  const list = grouped.get(group);
  if (list) {
    list.push(entry);
  } else {
    grouped.set(group, [entry]);
  }
}

// Sort groups: international first, then alphabetically
const sortedGroups = [...grouped.keys()].sort((a, b) => {
  if (a === INTERNATIONAL) return -1;
  if (b === INTERNATIONAL) return 1;
  return a.localeCompare(b);
});

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
      const label = COUNTRY_NAMES[group] ?? group;
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
