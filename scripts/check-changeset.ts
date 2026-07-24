#!/usr/bin/env bun

import { $ } from "bun";
import { readFileSync } from "node:fs";

const BASE_REF =
  process.env.CHANGESET_BASE_REF ?? "origin/main";
const CHANGESET_RE =
  /^\.changeset\/(?!README\.md$)[^/]+\.md$/;
const RUNTIME_SOURCE_RE =
  /^(?:packages\/(?:stdnum|stdnum-wasm)\/(?:(?:src|scripts)\/|(?:index\.cjs|registry(?:\.schema)?\.json|tsconfig\.json|tsdown\.config\.ts)$)|crates\/stdnum-(?:core|napi|py|wasm)\/)/;
const RUNTIME_MANIFESTS = new Set([
  "packages/stdnum/package.json",
  "packages/stdnum-wasm/package.json",
  "packages/stdnum-darwin-arm64/package.json",
  "packages/stdnum-darwin-x64/package.json",
  "packages/stdnum-linux-arm64-gnu/package.json",
  "packages/stdnum-linux-x64-gnu/package.json",
  "packages/stdnum-win32-x64-msvc/package.json",
]);
const RUNTIME_CARGO_MANIFESTS = new Set([
  "Cargo.lock",
  "Cargo.toml",
  "crates/stdnum-core/Cargo.toml",
  "crates/stdnum-napi/Cargo.toml",
  "crates/stdnum-py/Cargo.toml",
  "crates/stdnum-wasm/Cargo.toml",
]);
const GENERATED_VERSION_METADATA = new Set([
  ...RUNTIME_MANIFESTS,
  ...RUNTIME_CARGO_MANIFESTS,
  "CHANGELOG.md",
  "VERSION",
  "bun.lock",
]);

const firstSlash = BASE_REF.indexOf("/");
const baseRemote =
  firstSlash === -1
    ? "origin"
    : BASE_REF.slice(0, firstSlash);
const baseBranch =
  firstSlash === -1
    ? BASE_REF
    : BASE_REF.slice(firstSlash + 1);
const expectedVersionBranch = `changeset-release/${baseBranch}`;
const headRef = process.env.CHANGESET_HEAD_REF ?? "";
const repository = process.env.CHANGESET_REPOSITORY ?? "";
const headRepository =
  process.env.CHANGESET_HEAD_REPOSITORY ?? "";
const prAuthor = process.env.CHANGESET_PR_AUTHOR ?? "";
const VERSION_PR_AUTHOR = "stella-provenance-updater[bot]";

await $`git fetch --no-tags ${baseRemote} ${baseBranch}`
  .nothrow()
  .quiet();

const diff = async (filter: string): Promise<string[]> => {
  const result =
    await $`git diff --name-only --diff-filter=${filter} ${BASE_REF}...HEAD`
      .nothrow()
      .quiet();
  if (result.exitCode !== 0) {
    console.error(
      `changeset check: git diff ${BASE_REF}...HEAD failed (exit ${result.exitCode}).`,
    );
    console.error(result.stderr.toString());
    process.exit(1);
  }
  return result.stdout
    .toString()
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
};

const untracked =
  await $`git ls-files --others --exclude-standard`.quiet();
const untrackedFiles = untracked.stdout
  .toString()
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);
const addedFiles = [
  ...(await diff("A")),
  ...untrackedFiles,
];
const addedChangesets = addedFiles.filter((file) =>
  CHANGESET_RE.test(file),
);
const changedFiles = await diff("ACMRD");
const pendingChangesets = (await diff("ACMR")).filter(
  (file) => CHANGESET_RE.test(file),
);

const manifestAffectsPublishedRuntime = async (
  file: string,
): Promise<boolean> => {
  const previous = await $`git show ${BASE_REF}:${file}`
    .nothrow()
    .quiet();
  if (previous.exitCode !== 0) return true;

  let before: Record<string, unknown>;
  let after: Record<string, unknown>;
  try {
    before = JSON.parse(previous.stdout.toString());
    after = JSON.parse(readFileSync(file, "utf8"));
  } catch {
    return true;
  }

  // Development-only dependencies do not change the published package. All
  // other manifest fields remain release-significant.
  delete before.devDependencies;
  delete after.devDependencies;
  return JSON.stringify(before) !== JSON.stringify(after);
};

if (pendingChangesets.length > 0) {
  const status =
    await $`bun run changeset status --since ${BASE_REF}`
      .nothrow()
      .quiet();
  if (status.exitCode !== 0) {
    console.error(
      "changeset check: pending changeset validation failed.",
    );
    console.error(status.stdout.toString());
    console.error(status.stderr.toString());
    process.exit(1);
  }
}

if (
  addedChangesets.some((file) =>
    untrackedFiles.includes(file),
  )
) {
  const status = await $`bun run changeset status`
    .nothrow()
    .quiet();
  if (status.exitCode !== 0) {
    console.error(
      "changeset check: local changeset validation failed.",
    );
    console.error(status.stdout.toString());
    console.error(status.stderr.toString());
    process.exit(1);
  }
}

const changedRuntimeManifests = changedFiles.filter(
  (file) => RUNTIME_MANIFESTS.has(file),
);
const runtimeManifestChanged = (
  await Promise.all(
    changedRuntimeManifests.map(
      manifestAffectsPublishedRuntime,
    ),
  )
).some(Boolean);
const runtimeChanged =
  runtimeManifestChanged ||
  changedFiles.some(
    (file) =>
      RUNTIME_SOURCE_RE.test(file) ||
      RUNTIME_CARGO_MANIFESTS.has(file),
  );
if (!runtimeChanged) {
  console.log(
    "changeset check: no published runtime source changes; skipping.",
  );
  process.exit(0);
}

const generatedVersionMetadataOnly = changedFiles.every(
  (file) =>
    GENERATED_VERSION_METADATA.has(file) ||
    CHANGESET_RE.test(file),
);
if (
  headRef === expectedVersionBranch &&
  headRepository === repository &&
  prAuthor === VERSION_PR_AUTHOR &&
  changedFiles.includes("VERSION") &&
  generatedVersionMetadataOnly
) {
  console.log(
    "changeset check: synchronized release metadata includes VERSION. OK.",
  );
  process.exit(0);
}

if (addedChangesets.length > 0) {
  console.log(
    "changeset check: runtime source change has a changeset. OK.",
  );
  process.exit(0);
}

console.error(
  [
    "Missing changeset.",
    "",
    "This pull request changes published runtime source but adds no changeset.",
    "Add one with `bun run changeset`, or record an intentional no-release change",
    "with `bun run changeset --empty`.",
  ].join("\n"),
);
process.exit(1);
