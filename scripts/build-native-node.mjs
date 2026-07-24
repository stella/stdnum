import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(
  dirname(fileURLToPath(import.meta.url)),
);
const packageRoot = join(repoRoot, "packages", "stdnum");
const sourceNames = {
  darwin: "libstella_stdnum_napi.dylib",
  linux: "libstella_stdnum_napi.so",
  win32: "stella_stdnum_napi.dll",
};
const sourceName = sourceNames[process.platform];
if (sourceName === undefined) {
  throw new Error(
    `Unsupported native build platform: ${process.platform}`,
  );
}

execFileSync(
  "cargo",
  [
    "build",
    "-p",
    "stella-stdnum-napi",
    "--release",
    "--locked",
  ],
  {
    cwd: repoRoot,
    stdio: "inherit",
  },
);
const source = join(
  repoRoot,
  "target",
  "release",
  sourceName,
);
if (!existsSync(source))
  throw new Error(
    `Native build output is missing: ${source}`,
  );

copyFileSync(
  source,
  join(packageRoot, "stella_stdnum_napi.node"),
);
const sidecar = sidecarDirectory(
  process.platform,
  process.arch,
  detectLibc(),
);
if (sidecar !== null) {
  copyFileSync(
    source,
    join(
      repoRoot,
      "packages",
      sidecar,
      "stella_stdnum_napi.node",
    ),
  );
}

function sidecarDirectory(platform, arch, libc) {
  if (platform === "darwin" && arch === "arm64")
    return "stdnum-darwin-arm64";
  if (platform === "darwin" && arch === "x64")
    return "stdnum-darwin-x64";
  if (
    platform === "linux" &&
    arch === "arm64" &&
    libc === "gnu"
  )
    return "stdnum-linux-arm64-gnu";
  if (
    platform === "linux" &&
    arch === "x64" &&
    libc === "gnu"
  )
    return "stdnum-linux-x64-gnu";
  if (platform === "win32" && arch === "x64")
    return "stdnum-win32-x64-msvc";
  return null;
}

function detectLibc() {
  if (process.platform !== "linux") return undefined;
  return process.report?.getReport?.().header
    ?.glibcVersionRuntime
    ? "gnu"
    : "musl";
}
