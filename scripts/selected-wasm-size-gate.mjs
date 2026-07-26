import { spawnSync } from "node:child_process";
import { stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(
  dirname(fileURLToPath(import.meta.url)),
);
const maximumBytes = 640 * 1024;
const build = spawnSync(
  "cargo",
  [
    "build",
    "--locked",
    "--package",
    "stella-stdnum-wasm-size-fixture",
    "--release",
    "--target",
    "wasm32-unknown-unknown",
  ],
  { cwd: root, encoding: "utf8" },
);
if (build.status !== 0) {
  process.stderr.write(build.stdout);
  process.stderr.write(build.stderr);
  process.exit(build.status ?? 1);
}

const artifact = join(
  root,
  "target/wasm32-unknown-unknown/release/stella_stdnum_wasm_size_fixture.wasm",
);
const { size } = await stat(artifact);
if (size > maximumBytes) {
  throw new Error(
    `Selected-validator WebAssembly grew to ${String(size)} bytes; budget is ${String(maximumBytes)} bytes. Check for registry or heavyweight dependency coupling.`,
  );
}

console.log(
  `Selected-validator WebAssembly size gate passed (${String(size)} bytes; budget ${String(maximumBytes)} bytes).`,
);
