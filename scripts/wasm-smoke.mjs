import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";

const root = dirname(
  dirname(fileURLToPath(import.meta.url)),
);
const nativeRoot = join(
  root,
  "packages/stdnum-wasm/native",
);
const binding = await import(
  pathToFileURL(join(nativeRoot, "stella_stdnum_wasm.js"))
    .href
);
await binding.default({
  module_or_path: await readFile(
    join(nativeRoot, "stella_stdnum_wasm_bg.wasm"),
  ),
});
const registry = JSON.parse(
  await readFile(
    join(root, "packages/stdnum/registry.json"),
    "utf8",
  ),
);
const fixtures = JSON.parse(
  await readFile(
    join(root, "packages/stdnum/fixtures/parity.json"),
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
  throw new Error(
    "WASM validator IDs differ from registry.json",
  );
}
const wasmMetadata = new Map(
  binding.validators().map((entry) => [entry.id, entry]),
);
for (const entry of registry.validators) {
  const actual = wasmMetadata.get(entry.id);
  if (actual === undefined) {
    throw new Error(`WASM metadata is missing ${entry.id}`);
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
    throw new Error(`${entry.id}: WASM metadata drift`);
  }
}
for (const fixture of fixtures.fixtures) {
  const result = binding.validate(
    fixture.id,
    fixture.value,
  );
  if (result.valid !== fixture.expected) {
    throw new Error(
      `${fixture.id}: WASM validation parity failed`,
    );
  }
  if (
    binding.compact(fixture.id, fixture.value) !==
    fixture.compact
  ) {
    throw new Error(
      `${fixture.id}: WASM compact parity failed`,
    );
  }
  if (
    binding.format(fixture.id, fixture.value) !==
    fixture.format
  ) {
    throw new Error(
      `${fixture.id}: WASM format parity failed`,
    );
  }
}
if (!binding.validate("be.nn", "01010100126").valid) {
  throw new Error(
    "WASM date-sensitive validation did not use the host clock",
  );
}
const publicPackage = await import(
  join(root, "packages/stdnum-wasm/dist/index.js")
);
const publicResult = await publicPackage.validate(
  "cz.ico",
  "25596641",
);
if (!publicResult.valid) {
  throw new Error(
    "Published WASM adapter failed its public API smoke test",
  );
}

console.log(
  `WASM registry and fixture parity passed (${expectedIds.length} validators, ${fixtures.fixtures.length} cases).`,
);
