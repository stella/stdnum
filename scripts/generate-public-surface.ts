/**
 * Generate the binding-only TypeScript public surface from the committed
 * Rust registry snapshot.
 *
 * The normal path invokes the Rust registry exporter, making the core the
 * source of truth for runtime metadata and generated package entrypoints.
 * `--bootstrap-from-typescript` remains a one-time migration aid only.
 *
 * Usage:
 *   bun scripts/generate-public-surface.ts --bootstrap-from-typescript
 *   bun scripts/generate-public-surface.ts
 *   bun scripts/generate-public-surface.ts --check
 */

import {
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";

type Scope = "country" | "global";
type EntityType = "person" | "company" | "any";
type ParseKind = "birthDate" | "person" | null;

type RegistryValidator = {
  abbreviation: string;
  aliases: string[];
  canGenerate: boolean;
  candidatePattern: string | null;
  country: string | null;
  description: string | null;
  entityType: EntityType;
  examples: string[];
  exportName: string;
  id: string;
  lengths: number[];
  localName: string;
  name: string;
  namedExports: string[];
  namespaceExport: string | null;
  parseKind: ParseKind;
  scope: Scope;
  sourceUrl: string | null;
  subpath: string;
};

type Registry = {
  $schema: string;
  schemaVersion: 1;
  validators: RegistryValidator[];
};

type ValidatorLike = {
  abbreviation: string;
  aliases?: readonly string[];
  candidatePattern?: string;
  country?: string;
  description?: string;
  entityType: EntityType;
  examples?: readonly string[];
  generate?: () => string;
  lengths?: readonly number[];
  localName: string;
  name: string;
  parse?: (
    value: string,
  ) => { birthDate?: Date; gender?: string } | null;
  scope: Scope;
  sourceUrl?: string;
  validate: (value: string) => unknown;
};

const ROOT = join(import.meta.dir, "..");
const PACKAGE_ROOT = join(ROOT, "packages", "stdnum");
const REGISTRY_PATH = join(PACKAGE_ROOT, "registry.json");
const README_PATH = join(ROOT, "README.md");
const GENERATED_ROOT = join(
  PACKAGE_ROOT,
  "src",
  "generated",
);
const STANDARD_EXPORTS = new Set([
  "compact",
  "format",
  "generate",
  "parse",
  "validate",
]);

const isValidator = (
  value: unknown,
): value is ValidatorLike =>
  value !== null &&
  typeof value === "object" &&
  "validate" in value &&
  "scope" in value &&
  "name" in value;

const bootstrapRegistry = async (): Promise<Registry> => {
  const oldPackage = JSON.parse(
    await readFile(join(ROOT, "package.json"), "utf8"),
  ) as { exports: Record<string, unknown> };
  const all = await import(join(ROOT, "src", "index.ts"));
  const identities = new Map<
    ValidatorLike,
    {
      exportName: string;
      id: string;
      namespaceExport: string | null;
    }
  >();

  for (const [namespaceExport, value] of Object.entries(
    all,
  )) {
    if (isValidator(value)) {
      identities.set(value, {
        exportName: namespaceExport,
        id: namespaceExport,
        namespaceExport: null,
      });
      continue;
    }
    if (value === null || typeof value !== "object")
      continue;
    const namespace = namespaceExport.endsWith("_")
      ? namespaceExport.slice(0, -1)
      : namespaceExport;
    for (const [exportName, validator] of Object.entries(
      value,
    )) {
      if (!isValidator(validator)) continue;
      identities.set(validator, {
        exportName,
        id: `${namespace}.${exportName}`,
        namespaceExport,
      });
    }
  }

  const validators: RegistryValidator[] = [];
  for (const exportPath of Object.keys(
    oldPackage.exports,
  )) {
    if (
      exportPath === "." ||
      exportPath === "./types" ||
      exportPath === "./patterns"
    ) {
      continue;
    }
    const subpath = exportPath.slice(2);
    const module = await import(
      join(ROOT, "src", `${subpath}.ts`)
    );
    const validator: unknown = module.default;
    if (!isValidator(validator)) {
      throw new Error(
        `${exportPath} does not default-export a validator`,
      );
    }
    const identity = identities.get(validator);
    if (identity === undefined) {
      throw new Error(
        `${exportPath} is absent from src/index.ts`,
      );
    }
    const parsed = parseExample(validator);
    validators.push({
      abbreviation: validator.abbreviation,
      aliases: [...(validator.aliases ?? [])],
      canGenerate: typeof validator.generate === "function",
      candidatePattern: validator.candidatePattern ?? null,
      country: validator.country ?? null,
      description: validator.description ?? null,
      entityType: validator.entityType,
      examples: [...(validator.examples ?? [])],
      exportName: identity.exportName,
      id: identity.id,
      lengths: [...(validator.lengths ?? [])],
      localName: validator.localName,
      name: validator.name,
      namedExports: Object.keys(module)
        .filter((name) => name !== "default")
        .sort(),
      namespaceExport: identity.namespaceExport,
      parseKind: parsed,
      scope: validator.scope,
      sourceUrl: validator.sourceUrl ?? null,
      subpath,
    });
  }

  validators.sort((left, right) =>
    left.subpath.localeCompare(right.subpath),
  );
  return {
    $schema: "./registry.schema.json",
    schemaVersion: 1,
    validators,
  };
};

const parseExample = (
  validator: ValidatorLike,
): ParseKind => {
  if (typeof validator.parse !== "function") return null;
  const example = validator.examples?.[0];
  if (example === undefined) return "birthDate";
  const parsed = validator.parse(example);
  return parsed !== null && "gender" in parsed
    ? "person"
    : "birthDate";
};

const validateRegistry = (value: unknown): Registry => {
  if (value === null || typeof value !== "object") {
    throw new Error("registry must be an object");
  }
  const registry = value as Partial<Registry>;
  if (
    registry.schemaVersion !== 1 ||
    !Array.isArray(registry.validators)
  ) {
    throw new Error(
      "unsupported or malformed registry schema",
    );
  }
  const ids = new Set<string>();
  const subpaths = new Set<string>();
  for (const validator of registry.validators) {
    if (
      !validator.id ||
      !validator.subpath ||
      !validator.exportName
    ) {
      throw new Error(
        "every registry validator needs id, subpath, and exportName",
      );
    }
    if (ids.has(validator.id))
      throw new Error(
        `duplicate validator id: ${validator.id}`,
      );
    if (subpaths.has(validator.subpath)) {
      throw new Error(
        `duplicate validator subpath: ${validator.subpath}`,
      );
    }
    ids.add(validator.id);
    subpaths.add(validator.subpath);
  }
  return registry as Registry;
};

const rustRegistry = async (): Promise<Registry> => {
  const exporter = Bun.spawn(
    [
      "cargo",
      "run",
      "--quiet",
      "--locked",
      "-p",
      "stella-stdnum-core",
      "--example",
      "export_registry",
    ],
    { cwd: ROOT, stdout: "pipe", stderr: "inherit" },
  );
  const output = await new Response(exporter.stdout).text();
  if ((await exporter.exited) !== 0)
    throw new Error("Rust registry exporter failed");
  return validateRegistry(JSON.parse(output));
};

const quote = (value: unknown): string =>
  JSON.stringify(value);
const generatedHeader =
  "// Generated by scripts/generate-public-surface.ts. Do not edit.\n";

const replaceGeneratedRegion = (
  document: string,
  name: string,
  contents: string,
): string => {
  const begin = `<!-- BEGIN GENERATED: ${name} -->`;
  const end = `<!-- END GENERATED: ${name} -->`;
  const start = document.indexOf(begin);
  const finish = document.indexOf(end);
  if (start < 0 || finish < start) {
    throw new Error(
      `README generated region is missing: ${name}`,
    );
  }
  return `${document.slice(0, start + begin.length)}\n${contents.trim()}\n${document.slice(finish)}`;
};

const markdownTable = (
  headers: readonly string[],
  rows: readonly (readonly string[])[],
): string => {
  const widths = headers.map((header, index) =>
    Math.max(
      header.length,
      ...rows.map((row) => row.at(index)?.length ?? 0),
    ),
  );
  const row = (cells: readonly string[]): string =>
    `| ${cells
      .map((cell, index) =>
        cell.padEnd(widths.at(index) ?? cell.length),
      )
      .join(" | ")} |`;
  return [
    row(headers),
    row(widths.map((width) => "-".repeat(width))),
    ...rows.map(row),
  ].join("\n");
};

const readmeSupportedIdentifiers = (
  registry: Registry,
): string => {
  const globals = registry.validators.filter(
    (validator) => validator.scope === "global",
  );
  const countryValidators = registry.validators.filter(
    (validator) => validator.scope === "country",
  );
  const countries = new Set(
    countryValidators.map((validator) => validator.country),
  );
  const names = new Intl.DisplayNames(["en"], {
    type: "region",
  });
  const globalRows = globals.map((validator) => [
    validator.name,
    `\`${validator.subpath}\``,
    validator.entityType,
  ]);
  const countryRows: string[][] = [];
  let previousCountry: string | null = null;
  for (const validator of countryValidators) {
    const country = validator.country ?? "";
    const label =
      country === previousCountry
        ? ""
        : `${country} ${names.of(country) ?? country}`;
    countryRows.push([
      label,
      `\`${validator.subpath}\``,
      validator.abbreviation,
    ]);
    previousCountry = country;
  }
  return `### International

${markdownTable(["Identifier", "Module", "Type"], globalRows)}

### Countries

<details>
<summary>${String(countries.size)} countries supported (click to expand)</summary>

${markdownTable(["Country", "Module", "Identifier"], countryRows)}

</details>`;
};

const writeReadme = async (
  registry: Registry,
): Promise<void> => {
  const globalCount = registry.validators.filter(
    (validator) => validator.scope === "global",
  ).length;
  const countryCount = new Set(
    registry.validators
      .filter((validator) => validator.scope === "country")
      .map((validator) => validator.country),
  ).size;
  let readme = await readFile(README_PATH, "utf8");
  readme = replaceGeneratedRegion(
    readme,
    "registry-summary",
    `This package covers ${String(globalCount)} global identifiers and ${String(countryCount)} countries through ${String(registry.validators.length)}\nper-module entry points.`,
  );
  readme = replaceGeneratedRegion(
    readme,
    "supported-identifiers",
    readmeSupportedIdentifiers(registry),
  );
  await writeFile(README_PATH, readme);
};

const validatorModule = (
  validator: RegistryValidator,
): string => {
  const depth = validator.subpath.split("/").length;
  const relative = "../".repeat(depth);
  const typeName =
    validator.scope === "country"
      ? `CountryValidator<${quote(validator.country)}${
          validator.parseKind === null
            ? ""
            : `, ${parseType(validator.parseKind)}`
        }>`
      : `GlobalValidator${
          validator.parseKind === null
            ? ""
            : `<${parseType(validator.parseKind)}>`
        }`;
  const imports =
    validator.scope === "country"
      ? "CountryValidator"
      : "GlobalValidator";
  const parsedImport =
    validator.parseKind === null
      ? ""
      : `, ${parseType(validator.parseKind)}`;
  const named = new Set(validator.namedExports);
  const hasSpecialExports =
    validator.namedExports.some(
      (name) =>
        !STANDARD_EXPORTS.has(name) &&
        name !== "CHECK_LETTERS",
    ) || validator.id === "luhn";
  const lines = [
    generatedHeader.trimEnd(),
    `import { createValidator${hasSpecialExports ? ", getBinding" : ""} } from ${quote(`${relative}runtime`)};`,
    `import type { ${imports}${parsedImport} } from ${quote(`${relative}types`)};`,
    "",
    `const ${validator.exportName}: ${typeName} = createValidator(${quote(validator.id)});`,
    "",
    `export default ${validator.exportName};`,
  ];

  for (const name of [
    "compact",
    "format",
    "validate",
    "generate",
    "parse",
  ]) {
    if (named.has(name)) {
      if (name === "generate") {
        lines.push(
          validator.id === "luhn"
            ? "export const generate = (length = 16): string => getBinding().luhnGenerate(length);"
            : `export const generate = (): string =>\n  ${validator.exportName}.generate?.() ??\n  (() => {\n    throw new Error(${quote(`Validator ${validator.id} cannot generate values`)});\n  })();`,
        );
      } else {
        lines.push(
          `export const ${name} = ${validator.exportName}.${name};`,
        );
      }
    }
  }
  if (validator.id === "creditcard") {
    lines.push(
      'export type CardNetwork = "visa" | "mastercard" | "amex" | "discover" | "diners" | "jcb" | "unionpay" | "maestro";',
    );
  }
  lines.push(...specialExports(validator));
  return `${lines.join("\n")}\n`;
};

const parseType = (
  kind: Exclude<ParseKind, null>,
): string =>
  kind === "person" ? "ParsedPersonId" : "ParsedBirthDate";

const specialExports = (
  validator: RegistryValidator,
): string[] => {
  const extras = validator.namedExports.filter(
    (name) => !STANDARD_EXPORTS.has(name),
  );
  if (extras.length === 0) return [];
  const lines: string[] = [];
  for (const name of extras) {
    if (
      validator.id === "es.dni" &&
      name === "CHECK_LETTERS"
    ) {
      lines.push(
        `export const CHECK_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE";`,
      );
      continue;
    }
    lines.push(specialFunction(validator.id, name));
  }
  return lines;
};

const specialFunction = (
  id: string,
  name: string,
): string => {
  const signatures: Record<string, string> = {
    "be.nn:checksum":
      "(value: string): number | null => getBinding().beNnChecksum(value)",
    "creditcard:detectNetwork":
      "(value: string): CardNetwork | null => getBinding().detectNetwork(value)",
    "crypto.btcbase58:decodeBase58":
      "(value: string): Uint8Array | null => getBinding().decodeBase58(value)",
    "crypto.btcbech32:convertBits":
      "(values: readonly number[], fromBits: number, toBits: number): number[] | null => getBinding().convertBits(values, fromBits, toBits)",
    "crypto.btcbech32:polymod":
      "(values: readonly number[]): number => getBinding().polymod(values)",
    "crypto.btcbech32:validateBech32":
      '(value: string): { valid: true } | { valid: false; code: "format" | "checksum" | "component" } => getBinding().validateBech32(value)',
    "crypto.eth:hasValidEip55Checksum":
      "(value: string): boolean => getBinding().hasValidEip55Checksum(value)",
    "ee.ik:twoPassCheck":
      "(digits: string): number => getBinding().eeIkTwoPassCheck(digits)",
    "es.vat:cifChecksum":
      "(digits: string): number => getBinding().esVatCifChecksum(digits)",
    "gb.nhs:calcCheckDigit":
      "(value: string): number | null => getBinding().gbNhsCalcCheckDigit(value)",
    "gb.sedol:calcCheckDigit":
      "(value: string): string => getBinding().gbSedolCalcCheckDigit(value)",
  };
  const signature = signatures[`${id}:${name}`];
  if (signature === undefined) {
    throw new Error(
      `unsupported legacy named export ${id}:${name}`,
    );
  }
  return `export const ${name} = ${signature};`;
};

const namespaceModule = (
  validators: RegistryValidator[],
): string => {
  const exports = validators
    .sort((left, right) =>
      left.exportName.localeCompare(right.exportName),
    )
    .map(
      (validator) =>
        `export { default as ${validator.exportName} } from ${quote(`./${validator.subpath.split("/").at(-1)}`)};`,
    );
  return `${generatedHeader}${exports.join("\n")}\n`;
};

const indexModule = (registry: Registry): string => {
  const globals = registry.validators.filter(
    (validator) => validator.namespaceExport === null,
  );
  const namespaces = [
    ...new Set(
      registry.validators
        .map((validator) => validator.namespaceExport)
        .filter((value): value is string => value !== null),
    ),
  ].sort();
  const lines = [
    generatedHeader.trimEnd(),
    `export type * from "../types";`,
    ...globals.map(
      (validator) =>
        `export { default as ${validator.exportName} } from ${quote(`./${validator.subpath}`)};`,
    ),
    ...namespaces.map((namespace) => {
      const directory = registry.validators
        .find(
          (validator) =>
            validator.namespaceExport === namespace,
        )
        ?.subpath.split("/")[0];
      return `export * as ${namespace} from ${quote(`./${directory}/mod`)};`;
    }),
  ];
  if (
    globals.some(
      (validator) => validator.id === "creditcard",
    )
  ) {
    lines.splice(
      3,
      0,
      `export { detectNetwork } from "./creditcard";`,
      `export type { CardNetwork } from "../types";`,
    );
  }
  return `${lines.join("\n")}\n`;
};

const registryModule = (registry: Registry): string => {
  const imports = registry.validators.map(
    (validator, index) =>
      `import v${index} from ${quote(`./${validator.subpath}`)};`,
  );
  return `${generatedHeader}${imports.join("\n")}\n\nexport const allValidators = [${registry.validators
    .map((_validator, index) => `v${index}`)
    .join(", ")}] as const;\n`;
};

const metadataModule = (registry: Registry): string =>
  `${generatedHeader}export const registryMetadata = ${JSON.stringify(
    registry.validators,
    null,
    2,
  )} as const;\n`;

const conditionalExport = (output: string) => ({
  types: `./dist/${output}.d.ts`,
  import: `./dist/${output}.js`,
  default: `./dist/${output}.js`,
});

const writePackageExports = async (
  registry: Registry,
): Promise<void> => {
  const path = join(PACKAGE_ROOT, "package.json");
  const manifest = JSON.parse(
    await readFile(path, "utf8"),
  ) as Record<string, unknown>;
  const pinned = new Map<string, unknown>([
    [".", conditionalExport("index")],
    ["./types", conditionalExport("types")],
  ]);
  const rest = new Map<string, unknown>([
    ...registry.validators.map(
      (validator) =>
        [
          `./${validator.subpath}`,
          conditionalExport(validator.subpath),
        ] as const,
    ),
    ["./native", conditionalExport("native")],
    ["./native-node", conditionalExport("native-node")],
    ["./catalog", conditionalExport("catalog")],
    ["./patterns", conditionalExport("patterns")],
    ["./registry.json", "./registry.json"],
  ]);
  manifest.exports = Object.fromEntries([
    ...pinned,
    ...[...rest].sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  ]);
  await writeFile(
    path,
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
};

const writeGenerated = async (
  registry: Registry,
): Promise<void> => {
  await rm(GENERATED_ROOT, {
    recursive: true,
    force: true,
  });
  for (const validator of registry.validators) {
    const path = join(
      GENERATED_ROOT,
      `${validator.subpath}.ts`,
    );
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, validatorModule(validator));
  }
  const grouped = Map.groupBy(
    registry.validators.filter(
      (validator) => validator.namespaceExport !== null,
    ),
    (validator) => validator.subpath.split("/")[0] ?? "",
  );
  for (const [directory, validators] of grouped) {
    await writeFile(
      join(GENERATED_ROOT, directory, "mod.ts"),
      namespaceModule(validators),
    );
  }
  await writeFile(
    join(GENERATED_ROOT, "index.ts"),
    indexModule(registry),
  );
  await writeFile(
    join(GENERATED_ROOT, "registry.ts"),
    registryModule(registry),
  );
  await writeFile(
    join(GENERATED_ROOT, "metadata.ts"),
    metadataModule(registry),
  );
  await writePackageExports(registry);
  await writeReadme(registry);
  const formatter = Bun.spawn(
    [
      "bunx",
      "oxfmt",
      GENERATED_ROOT,
      join(PACKAGE_ROOT, "package.json"),
      REGISTRY_PATH,
      README_PATH,
    ],
    { cwd: ROOT, stdout: "ignore", stderr: "inherit" },
  );
  if ((await formatter.exited) !== 0)
    throw new Error("failed to format generated files");
};

const snapshotGenerated = async (): Promise<
  Map<string, string>
> => {
  const glob = new Bun.Glob("**/*.ts");
  const snapshot = new Map<string, string>();
  for await (const relative of glob.scan(GENERATED_ROOT)) {
    snapshot.set(
      relative,
      await readFile(
        join(GENERATED_ROOT, relative),
        "utf8",
      ),
    );
  }
  return snapshot;
};

const main = async (): Promise<void> => {
  const bootstrap = process.argv.includes(
    "--bootstrap-from-typescript",
  );
  const check = process.argv.includes("--check");
  if (bootstrap && check)
    throw new Error(
      "bootstrap and check modes are mutually exclusive",
    );

  const registry = bootstrap
    ? await bootstrapRegistry()
    : await rustRegistry();
  if (!check) {
    await mkdir(PACKAGE_ROOT, { recursive: true });
    await writeFile(
      REGISTRY_PATH,
      `${JSON.stringify(registry, null, 2)}\n`,
    );
    await writeGenerated(registry);
    console.log(
      `Generated ${registry.validators.length} validator modules.`,
    );
    return;
  }
  const committedRegistry = validateRegistry(
    JSON.parse(await readFile(REGISTRY_PATH, "utf8")),
  );
  if (
    JSON.stringify(committedRegistry) !==
    JSON.stringify(registry)
  ) {
    throw new Error(
      "registry.json differs from the Rust registry exporter",
    );
  }
  const before = await snapshotGenerated();
  const manifestPath = join(PACKAGE_ROOT, "package.json");
  const manifestBefore = await readFile(
    manifestPath,
    "utf8",
  );
  const readmeBefore = await readFile(README_PATH, "utf8");
  await writeGenerated(registry);
  const after = await snapshotGenerated();
  const manifestAfter = await readFile(
    manifestPath,
    "utf8",
  );
  const readmeAfter = await readFile(README_PATH, "utf8");
  const unchanged =
    before.size === after.size &&
    manifestBefore === manifestAfter &&
    readmeBefore === readmeAfter &&
    [...before].every(
      ([path, contents]) => after.get(path) === contents,
    );
  if (!unchanged) {
    throw new Error(
      "generated public surface is out of date",
    );
  }
  console.log(
    `Generated surface is current (${registry.validators.length} validators).`,
  );
};

await main();
