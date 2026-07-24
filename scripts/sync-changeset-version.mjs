import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import process from "node:process";

const PACKAGE_FILE = "packages/stdnum/package.json";
const VERSION_RE =
  /^[0-9]+\.[0-9]+\.[0-9]+(-(rc|beta|alpha)\.[0-9]+)?$/;

const { version } = JSON.parse(
  readFileSync(PACKAGE_FILE, "utf8"),
);
if (
  typeof version !== "string" ||
  !VERSION_RE.test(version)
) {
  console.error(
    `${PACKAGE_FILE} has invalid version '${version}'`,
  );
  process.exit(1);
}

execFileSync(
  process.execPath,
  [
    "scripts/version-sync.mjs",
    "sync",
    "--version",
    version,
  ],
  { stdio: "inherit" },
);
execFileSync(
  process.execPath,
  ["scripts/sync-cargo-lock-workspace-versions.mjs"],
  {
    stdio: "inherit",
  },
);
execFileSync(
  "cargo",
  [
    "metadata",
    "--locked",
    "--no-deps",
    "--format-version",
    "1",
  ],
  {
    stdio: "ignore",
  },
);
