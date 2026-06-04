#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const VERSION_PATTERN =
  /^[0-9]+\.[0-9]+\.[0-9]+(?:-(?:alpha|beta|rc)\.[0-9]+)?$/;

const repoPath = (...segments) =>
  path.join(ROOT, ...segments);

const readJson = (filePath) =>
  JSON.parse(fs.readFileSync(filePath, "utf8"));

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
  const packageJsonPath = repoPath("package.json");
  const manifest = readJson(packageJsonPath);
  writeVersion(version);
  manifest.version = version;
  writeJson(packageJsonPath, manifest);
};

const checkVersion = (version) => {
  const packageJsonPath = repoPath("package.json");
  const manifest = readJson(packageJsonPath);
  const mismatches = [];

  if (readVersion() !== version) {
    mismatches.push(
      `${repoPath("VERSION")}: expected ${version}`,
    );
  }
  if (manifest.version !== version) {
    mismatches.push(
      `${packageJsonPath}: version=${manifest.version}; expected ${version}`,
    );
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
