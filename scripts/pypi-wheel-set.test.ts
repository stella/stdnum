import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const workflow = readFileSync(
  ".github/workflows/release.yml",
  "utf8",
);
const startMarker = "          python3 - <<'PY'\n";
const start = workflow.indexOf(startMarker);
const end = workflow.indexOf("\n          PY", start);

expect(start).not.toBe(-1);
expect(end).not.toBe(-1);

const verifier = workflow
  .slice(start + startMarker.length, end)
  .split("\n")
  .map((line) => line.replace(/^          /, ""))
  .join("\n");

const harness = String.raw`
import os
import sys
import tempfile
import zipfile
from pathlib import Path

verifier, mode = sys.argv[1:]
platforms = [
    "manylinux_2_17_x86_64.manylinux2014_x86_64",
    "manylinux_2_17_aarch64.manylinux2014_aarch64",
    "macosx_10_12_x86_64",
    "macosx_11_0_arm64",
    "win_amd64",
]
if mode == "duplicate-platform":
    platforms[-1] = "macosx_12_0_arm64"
if mode == "mixed-platform-tag":
    platforms[-1] = "manylinux_2_17_x86_64.win_amd64"
if mode == "unsupported-linux-baseline":
    platforms[0] = "manylinux_999_999_x86_64.manylinux9999_x86_64"
if mode == "unsupported-macos-baseline":
    platforms[2] = "macosx_999_0_x86_64"

with tempfile.TemporaryDirectory() as temporary:
    root = Path(temporary)
    dist = root / "dist"
    dist.mkdir()
    for index, platform in enumerate(platforms):
        version = "9.0.0" if mode == "wrong-version" and index == 0 else "2.3.2"
        metadata_name = "other-project" if mode == "wrong-name" and index == 0 else "stella-stdnum"
        wheel = dist / f"stella_stdnum-{version}-cp311-abi3-{platform}.whl"
        with zipfile.ZipFile(wheel, "w") as archive:
            archive.writestr(
                f"stella_stdnum-{version}.dist-info/METADATA",
                f"Metadata-Version: 2.4\nName: {metadata_name}\nVersion: {version}\n",
            )
    os.chdir(root)
    os.environ["EXPECTED_VERSION"] = "2.3.2"
    exec(compile(verifier, "release-wheel-verifier", "exec"), {})
`;

const runVerifier = (mode: string) =>
  Bun.spawnSync({
    cmd: ["python3", "-c", harness, verifier, mode],
    stdout: "pipe",
    stderr: "pipe",
  });

test("accepts the exact five-wheel release set", () => {
  expect(runVerifier("valid").exitCode).toBe(0);
});

test.each([
  "duplicate-platform",
  "mixed-platform-tag",
  "wrong-name",
  "wrong-version",
  "unsupported-linux-baseline",
  "unsupported-macos-baseline",
])("rejects %s", (mode) => {
  expect(runVerifier(mode).exitCode).not.toBe(0);
});
