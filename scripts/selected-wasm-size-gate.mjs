import { spawnSync } from "node:child_process";
import { stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(
  dirname(fileURLToPath(import.meta.url)),
);
const fixtureManifest = join(
  root,
  "crates/stdnum-wasm-size-fixture/Cargo.toml",
);
const targetDirectory = join(
  root,
  "target/downstream-wasm-size",
);
const maximumBytes = 720 * 1024;

const cargo = (command, args = []) => {
  const result = spawnSync(
    "cargo",
    [
      command,
      "--locked",
      "--manifest-path",
      fixtureManifest,
      ...args,
    ],
    { cwd: root, encoding: "utf8" },
  );
  if (result.status !== 0) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }
};

// The native test independently pins and exercises every validator in the
// workload before its default-profile WebAssembly build is measured.
cargo("clippy", [
  "--all-targets",
  "--target-dir",
  targetDirectory,
  "--",
  "-D",
  "warnings",
]);
cargo("test", ["--target-dir", targetDirectory]);
cargo("build", [
  "--release",
  "--target",
  "wasm32-unknown-unknown",
  "--target-dir",
  targetDirectory,
]);

const artifact = join(
  targetDirectory,
  "wasm32-unknown-unknown/release/stella_stdnum_wasm_size_fixture.wasm",
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
