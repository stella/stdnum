import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(
  dirname(fileURLToPath(import.meta.url)),
);
const output = join(
  repoRoot,
  "packages",
  "stdnum-wasm",
  "native",
);
mkdirSync(output, { recursive: true });

execFileSync(
  "cargo",
  [
    "build",
    "-p",
    "stella-stdnum-wasm",
    "--target",
    "wasm32-unknown-unknown",
    "--release",
    "--locked",
  ],
  { cwd: repoRoot, stdio: "inherit" },
);
execFileSync(
  "wasm-bindgen",
  [
    join(
      repoRoot,
      "target",
      "wasm32-unknown-unknown",
      "release",
      "stella_stdnum_wasm.wasm",
    ),
    "--target",
    "web",
    "--out-dir",
    output,
    "--out-name",
    "stella_stdnum_wasm",
    "--typescript",
  ],
  { cwd: repoRoot, stdio: "inherit" },
);
