import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const root = dirname(
  dirname(fileURLToPath(import.meta.url)),
);
const require = createRequire(import.meta.url);
const { loadNativeBinding } = require(
  join(root, "packages/stdnum/index.cjs"),
);
const binding = loadNativeBinding();
const fixtureSet = JSON.parse(
  readFileSync(
    join(root, "packages/stdnum/fixtures/parity.json"),
    "utf8",
  ),
);
const registry = JSON.parse(
  readFileSync(
    join(root, "packages/stdnum/registry.json"),
    "utf8",
  ),
);

const expectedIds = registry.validators
  .map((entry) => entry.id)
  .sort((left, right) => left.localeCompare(right));
const actualIds = [...binding.validatorIds()].sort(
  (left, right) => left.localeCompare(right),
);
if (
  JSON.stringify(actualIds) !== JSON.stringify(expectedIds)
) {
  const missing = expectedIds.filter(
    (id) => !actualIds.includes(id),
  );
  const unexpected = actualIds.filter(
    (id) => !expectedIds.includes(id),
  );
  throw new Error(
    `Registry ID drift: missing=${missing.join(",") || "none"}; unexpected=${unexpected.join(",") || "none"}`,
  );
}

const nativeMetadata = new Map(
  binding.validators().map((entry) => [entry.id, entry]),
);
for (const entry of registry.validators) {
  const actual = nativeMetadata.get(entry.id);
  if (actual === undefined) {
    throw new Error(
      `Native metadata is missing ${entry.id}`,
    );
  }
  const expected = {
    id: entry.id,
    name: entry.name,
    localName: entry.localName,
    abbreviation: entry.abbreviation,
    description: entry.description,
    aliases: entry.aliases,
    candidatePattern: entry.candidatePattern,
    scope: entry.scope,
    country: entry.country,
    entityType: entry.entityType,
    sourceUrl: entry.sourceUrl,
    lengths: entry.lengths,
    examples: entry.examples,
    canGenerate: entry.canGenerate,
    canParse: entry.parseKind !== null,
  };
  const normalizedActual = {
    ...actual,
    candidatePattern: actual.candidatePattern ?? null,
    country: actual.country ?? null,
    description: actual.description ?? null,
    sourceUrl: actual.sourceUrl ?? null,
  };
  if (!isDeepStrictEqual(normalizedActual, expected)) {
    throw new Error(
      `${entry.id}: metadata drift\nexpected=${JSON.stringify(expected)}\nactual=${JSON.stringify(normalizedActual)}`,
    );
  }
}

for (const fixture of fixtureSet.fixtures) {
  const result = binding.validate(
    fixture.id,
    fixture.value,
  );
  if (result.valid !== fixture.expected) {
    throw new Error(
      `${fixture.id}: validation parity failed for ${fixture.value}`,
    );
  }
  if (
    binding.compact(fixture.id, fixture.value) !==
    fixture.compact
  ) {
    throw new Error(
      `${fixture.id}: compact parity failed for ${fixture.value}`,
    );
  }
  if (
    binding.format(fixture.id, fixture.value) !==
    fixture.format
  ) {
    throw new Error(
      `${fixture.id}: format parity failed for ${fixture.value}`,
    );
  }
}

console.log(
  `Native registry and fixture parity passed (${expectedIds.length} validators, ${fixtureSet.fixtures.length} cases).`,
);
