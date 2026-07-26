#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const VERSION_PATTERN =
  /^[0-9]+\.[0-9]+\.[0-9]+(?:-(?:alpha|beta|rc)\.[0-9]+)?$/;
const PUBLISHED_PACKAGES = [
  "packages/stdnum/package.json",
  "packages/stdnum-darwin-arm64/package.json",
  "packages/stdnum-darwin-x64/package.json",
  "packages/stdnum-linux-arm64-gnu/package.json",
  "packages/stdnum-linux-x64-gnu/package.json",
  "packages/stdnum-wasm/package.json",
  "packages/stdnum-win32-x64-msvc/package.json",
];
const STANDALONE_CARGO_MANIFESTS = [
  "crates/stdnum-wasm-size-fixture/Cargo.toml",
];
const repoPath = (...segments) =>
  path.join(ROOT, ...segments);

const readJson = (filePath) =>
  JSON.parse(fs.readFileSync(filePath, "utf8"));

const FIXED_DEPENDENCIES = new Set(
  PUBLISHED_PACKAGES.map(
    (packageFile) => readJson(repoPath(packageFile)).name,
  ),
);

const writeJson = (filePath, value) => {
  fs.writeFileSync(
    filePath,
    `${JSON.stringify(value, null, 2)}\n`,
  );
};

const readVersion = () =>
  fs.readFileSync(repoPath("VERSION"), "utf8").trim();

const writeVersion = (version) => {
  fs.writeFileSync(repoPath("VERSION"), `${version}\n`);
};

const cargoMetadata = (manifest) =>
  JSON.parse(
    execFileSync(
      "cargo",
      [
        "metadata",
        "--locked",
        "--manifest-path",
        repoPath(manifest),
        "--format-version",
        "1",
      ],
      { encoding: "utf8" },
    ),
  );

const syncStandaloneCargoLocks = () => {
  for (const manifest of STANDALONE_CARGO_MANIFESTS) {
    execFileSync(
      "cargo",
      [
        "generate-lockfile",
        "--manifest-path",
        repoPath(manifest),
      ],
      { stdio: "inherit" },
    );
  }
};

const parseArgs = () => {
  const [command, ...rest] = process.argv.slice(2);
  const args = new Map();

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === "--version" || token === "--tag") {
      const value = rest[index + 1];
      if (value == null) {
        throw new Error(`Missing value for ${token}`);
      }
      args.set(token.slice(2), value);
      index += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${token}`);
  }

  return { command, args };
};

const expectedVersion = (args) => {
  const tag = args.get("tag");
  const version =
    args.get("version") ??
    (tag ? tag.replace(/^v/, "") : readVersion());
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(
      `Expected 1.2.3, 1.2.3-rc.1, 1.2.3-beta.1, or 1.2.3-alpha.1; got '${version}'`,
    );
  }
  return version;
};

const syncVersion = (version) => {
  const cargoManifestPath = repoPath("Cargo.toml");
  const cargoManifest = fs.readFileSync(
    cargoManifestPath,
    "utf8",
  );
  writeVersion(version);
  for (const packageFile of PUBLISHED_PACKAGES) {
    const packageJsonPath = repoPath(packageFile);
    const manifest = readJson(packageJsonPath);
    manifest.version = version;
    for (const dependencyField of [
      "dependencies",
      "optionalDependencies",
      "peerDependencies",
    ]) {
      const dependencies = manifest[dependencyField];
      if (dependencies == null) continue;
      for (const dependency of Object.keys(dependencies)) {
        if (FIXED_DEPENDENCIES.has(dependency)) {
          dependencies[dependency] = version;
        }
      }
    }
    writeJson(packageJsonPath, manifest);
  }
  fs.writeFileSync(
    cargoManifestPath,
    cargoManifest.replace(
      /(\[workspace\.package\][\s\S]*?\nversion = ")[^"]+("\n)/,
      `$1${version}$2`,
    ),
  );
  syncStandaloneCargoLocks();
};

const checkVersion = (version) => {
  const cargoManifestPath = repoPath("Cargo.toml");
  const cargoManifest = fs.readFileSync(
    cargoManifestPath,
    "utf8",
  );
  const cargoVersion = cargoManifest.match(
    /\[workspace\.package\][\s\S]*?\nversion = "([^"]+)"\n/,
  )?.[1];
  const mismatches = [];

  if (readVersion() !== version) {
    mismatches.push(
      `${repoPath("VERSION")}: expected ${version}`,
    );
  }
  for (const packageFile of PUBLISHED_PACKAGES) {
    const packageJsonPath = repoPath(packageFile);
    const manifest = readJson(packageJsonPath);
    if (manifest.version !== version) {
      mismatches.push(
        `${packageJsonPath}: version=${manifest.version}; expected ${version}`,
      );
    }
    for (const dependencyField of [
      "dependencies",
      "optionalDependencies",
      "peerDependencies",
    ]) {
      const dependencies = manifest[dependencyField];
      if (dependencies == null) continue;
      for (const [
        dependency,
        dependencyVersion,
      ] of Object.entries(dependencies)) {
        if (
          FIXED_DEPENDENCIES.has(dependency) &&
          dependencyVersion !== version
        ) {
          mismatches.push(
            `${packageJsonPath}: ${dependency}=${dependencyVersion}; expected ${version}`,
          );
        }
      }
    }
  }
  if (cargoVersion !== version) {
    mismatches.push(
      `${cargoManifestPath}: workspace.package.version=${cargoVersion}; expected ${version}`,
    );
  }
  for (const manifest of STANDALONE_CARGO_MANIFESTS) {
    const core = cargoMetadata(manifest).packages.find(
      ({ name }) => name === "stella-stdnum-core",
    );
    if (core?.version !== version) {
      mismatches.push(
        `${repoPath(manifest)}: stella-stdnum-core=${core?.version ?? "missing"}; expected ${version}`,
      );
    }
  }

  if (mismatches.length === 0) {
    return;
  }

  console.error("Version drift detected:");
  for (const mismatch of mismatches) {
    console.error(`- ${mismatch}`);
  }
  process.exit(1);
};

const main = () => {
  const { command, args } = parseArgs();

  if (command !== "sync" && command !== "check") {
    console.error(
      "Usage: node scripts/version-sync.mjs <sync|check> [--version <semver>] [--tag <git-tag>]",
    );
    process.exit(1);
  }

  const version = expectedVersion(args);

  if (command === "sync") {
    syncVersion(version);
    return;
  }

  checkVersion(version);
};

main();
