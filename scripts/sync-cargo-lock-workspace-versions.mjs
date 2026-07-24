import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const WORKSPACE_PACKAGE_NAMES = [
  "stella-stdnum-core",
  "stella-stdnum-napi",
  "stella-stdnum-py",
  "stella-stdnum-wasm",
];

const VERSION_PATTERN =
  /^[0-9]+\.[0-9]+\.[0-9]+(?:-(?:alpha|beta|rc)\.[0-9]+)?$/;

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const syncCargoLockContents = (
  lockContents,
  version,
) => {
  if (!VERSION_PATTERN.test(version)) {
    throw new Error(
      `Invalid workspace version '${version}'`,
    );
  }

  let updated = lockContents;
  for (const packageName of WORKSPACE_PACKAGE_NAMES) {
    const packageVersion = new RegExp(
      `(\\[\\[package\\]\\]\\nname = "${escapeRegExp(packageName)}"\\nversion = ")[^"]+("(?:\\n|$))`,
      "g",
    );
    const matches = [...updated.matchAll(packageVersion)];
    if (matches.length !== 1) {
      throw new Error(
        `Expected exactly one Cargo.lock entry for ${packageName}; found ${matches.length}`,
      );
    }
    updated = updated.replace(
      packageVersion,
      `$1${version}$2`,
    );
  }
  return updated;
};

const isMain =
  process.argv[1] != null &&
  path.resolve(process.argv[1]) ===
    fileURLToPath(import.meta.url);

if (isMain) {
  const root = fileURLToPath(
    new URL("../", import.meta.url),
  );
  const cargoManifest = fs.readFileSync(
    path.join(root, "Cargo.toml"),
    "utf8",
  );
  const version = cargoManifest.match(
    /\[workspace\.package\][\s\S]*?\nversion = "([^"]+)"\n/,
  )?.[1];
  if (version == null) {
    throw new Error(
      "Cargo.toml has no workspace.package version",
    );
  }

  const cargoLockPath = path.join(root, "Cargo.lock");
  const cargoLock = fs.readFileSync(cargoLockPath, "utf8");
  fs.writeFileSync(
    cargoLockPath,
    syncCargoLockContents(cargoLock, version),
  );
}
