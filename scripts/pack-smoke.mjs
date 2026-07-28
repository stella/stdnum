import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(
  dirname(fileURLToPath(import.meta.url)),
);
const packageRoot = join(root, "packages/stdnum");
const manifest = JSON.parse(
  readFileSync(join(packageRoot, "package.json"), "utf8"),
);
const validatorExports = Object.keys(
  manifest.exports,
).filter(
  (key) =>
    /^\.\/[a-z0-9]+(?:\/[a-z0-9]+)?$/u.test(key) &&
    ![
      "./catalog",
      "./native",
      "./patterns",
      "./types",
    ].includes(key),
);
if (validatorExports.length !== 176) {
  throw new Error(
    `Expected 176 validator subpaths, found ${validatorExports.length}`,
  );
}
for (const value of Object.values(manifest.exports)) {
  if (typeof value === "string") continue;
  for (const target of Object.values(value)) {
    if (!existsSync(join(packageRoot, target))) {
      throw new Error(
        `Missing built export target: ${target}`,
      );
    }
  }
}

const sidecar = hostSidecar();
if (sidecar === null) {
  throw new Error(
    `No packaged native sidecar for ${process.platform}-${process.arch}`,
  );
}
const sidecarRoot = join(
  root,
  "packages",
  sidecar.directory,
);
const temporaryRoot = mkdtempSync(
  join(tmpdir(), "stdnum-pack-smoke-"),
);

try {
  const tarballRoot = join(temporaryRoot, "tarballs");
  mkdirSync(tarballRoot);
  const mainPack = pack(packageRoot, tarballRoot);
  const sidecarPack = pack(sidecarRoot, tarballRoot);
  assertPackFiles(mainPack, [
    "dist/index.js",
    "dist/index.d.ts",
    "index.cjs",
    "registry.json",
  ]);
  assertPackFiles(sidecarPack, [
    "index.cjs",
    "stella_stdnum_napi.node",
  ]);

  const consumerRoot = join(temporaryRoot, "consumer");
  mkdirSync(consumerRoot);
  writeFileSync(
    join(consumerRoot, "package.json"),
    `${JSON.stringify(
      {
        name: "stdnum-pack-smoke",
        private: true,
        type: "module",
        dependencies: {
          "@stll/stdnum": `file:${join(tarballRoot, mainPack.filename)}`,
          [sidecar.name]: `file:${join(tarballRoot, sidecarPack.filename)}`,
        },
      },
      null,
      2,
    )}\n`,
  );
  execFileSync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--omit=optional",
      "--no-audit",
      "--no-fund",
    ],
    { cwd: consumerRoot, stdio: "inherit" },
  );
  execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "--eval",
      `
        const stdnum = await import("@stll/stdnum");
        const cpf = await import("@stll/stdnum/br/cpf");
        if (!stdnum.br.cpf.validate("39053344705").valid) {
          throw new Error("packed root export failed");
        }
        if (!cpf.validate("390.533.447-05").valid) {
          throw new Error("packed subpath export failed");
        }
      `,
    ],
    { cwd: consumerRoot, stdio: "inherit" },
  );
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

console.log(
  `Pack smoke passed (${validatorExports.length} validator subpaths, installed ${sidecar.name}).`,
);

function pack(directory, destination) {
  const packed = JSON.parse(
    execFileSync(
      "npm",
      [
        "pack",
        "--json",
        "--ignore-scripts",
        "--pack-destination",
        destination,
      ],
      { cwd: directory, encoding: "utf8" },
    ),
  );
  const result = packed[0];
  if (result === undefined) {
    throw new Error(
      `npm pack returned no result for ${directory}`,
    );
  }
  return result;
}

function assertPackFiles(packResult, required) {
  const files = new Set(
    packResult.files.map((entry) => entry.path),
  );
  for (const path of required) {
    if (!files.has(path)) {
      throw new Error(
        `${packResult.name} is missing ${path}`,
      );
    }
  }
}

function hostSidecar() {
  if (
    process.platform === "darwin" &&
    process.arch === "arm64"
  ) {
    return {
      directory: "stdnum-darwin-arm64",
      name: "@stll/stdnum-darwin-arm64",
    };
  }
  if (
    process.platform === "darwin" &&
    process.arch === "x64"
  ) {
    return {
      directory: "stdnum-darwin-x64",
      name: "@stll/stdnum-darwin-x64",
    };
  }
  if (
    process.platform === "linux" &&
    process.arch === "arm64"
  ) {
    return {
      directory: "stdnum-linux-arm64-gnu",
      name: "@stll/stdnum-linux-arm64-gnu",
    };
  }
  if (
    process.platform === "linux" &&
    process.arch === "x64"
  ) {
    return {
      directory: "stdnum-linux-x64-gnu",
      name: "@stll/stdnum-linux-x64-gnu",
    };
  }
  if (
    process.platform === "win32" &&
    process.arch === "x64"
  ) {
    return {
      directory: "stdnum-win32-x64-msvc",
      name: "@stll/stdnum-win32-x64-msvc",
    };
  }
  return null;
}
