import { execFileSync, spawn } from "node:child_process";
import {
  accessSync,
  constants,
  createReadStream,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = dirname(
  dirname(fileURLToPath(import.meta.url)),
);
const temporaryRoot = mkdtempSync(
  join(root, ".stdnum-browser-smoke-"),
);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".wasm": "application/wasm",
};

try {
  const tarballRoot = join(temporaryRoot, "tarballs");
  mkdirSync(tarballRoot);
  const mainPack = pack(
    join(root, "packages/stdnum"),
    tarballRoot,
  );
  const wasmPack = pack(
    join(root, "packages/stdnum-wasm"),
    tarballRoot,
  );

  const consumerRoot = join(temporaryRoot, "consumer");
  mkdirSync(consumerRoot);
  writeFileSync(
    join(consumerRoot, "package.json"),
    `${JSON.stringify(
      {
        name: "stdnum-browser-smoke",
        private: true,
        type: "module",
        dependencies: {
          "@stll/stdnum": `file:${join(tarballRoot, mainPack.filename)}`,
          "@stll/stdnum-wasm": `file:${join(tarballRoot, wasmPack.filename)}`,
        },
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(consumerRoot, "index.html"),
    '<!doctype html><html><body data-result="pending"><script type="module" src="/src.js"></script></body></html>\n',
  );
  writeFileSync(
    join(consumerRoot, "src.js"),
    `
      import { validate } from "@stll/stdnum/cz/ico";
      const result = validate("25596641");
      document.body.dataset.result = result.valid ? "pass" : "fail";
      document.body.dataset.compact = result.valid ? result.compact : "";
    `,
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

  await build({
    root: consumerRoot,
    configFile: false,
    logLevel: "warn",
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  });

  const outputRoot = join(consumerRoot, "dist");
  assertBrowserBundle(outputRoot);
  const server = createServer((request, response) => {
    const requestPath = new URL(
      request.url ?? "/",
      "http://127.0.0.1",
    ).pathname;
    const relativePath =
      requestPath === "/"
        ? "index.html"
        : requestPath.slice(1);
    const path = join(outputRoot, relativePath);
    if (!existsSync(path) || !statSync(path).isFile()) {
      response.writeHead(404).end();
      return;
    }
    response.setHeader(
      "Content-Type",
      mimeTypes[extname(path)] ??
        "application/octet-stream",
    );
    createReadStream(path).pipe(response);
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try {
    const address = server.address();
    if (address === null || typeof address === "string")
      throw new Error(
        "Browser smoke server has no TCP address",
      );
    const html = await runChrome(
      `http://127.0.0.1:${address.port}/`,
    );
    if (!html.includes('data-result="pass"'))
      throw new Error(
        `Browser validator did not execute successfully:\n${html}`,
      );
    if (!html.includes('data-compact="25596641"'))
      throw new Error(
        `Browser validator returned the wrong compact value:\n${html}`,
      );
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) =>
        error === undefined ? resolve() : reject(error),
      );
    });
  }
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}

console.log(
  "Browser smoke passed (Vite production bundle, WASM runtime, synchronous validator subpath).",
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
  if (result === undefined)
    throw new Error(
      `npm pack returned no result for ${directory}`,
    );
  return result;
}

function assertBrowserBundle(directory) {
  const forbidden = [
    "__vite-browser-external",
    "native-node",
    "node:module",
    "node:process",
  ];
  for (const path of walk(directory)) {
    if (!path.endsWith(".js")) continue;
    const source = readFileSync(path, "utf8");
    for (const marker of forbidden) {
      if (source.includes(marker))
        throw new Error(
          `Browser bundle contains forbidden runtime marker ${marker}: ${path}`,
        );
    }
  }
}

function walk(directory) {
  const paths = [];
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory())
      paths.push(...walk(path));
    else paths.push(path);
  }
  return paths;
}

async function runChrome(url) {
  const chrome = findChrome();
  const child = spawn(
    chrome,
    [
      "--headless=new",
      "--disable-gpu",
      "--no-sandbox",
      "--virtual-time-budget=5000",
      "--dump-dom",
      url,
    ],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let stdout = "";
  let stderr = "";
  child.stdout.setEncoding("utf8");
  child.stderr.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    stdout += chunk;
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });
  const exitCode = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });
  if (exitCode !== 0)
    throw new Error(
      `Chrome exited with code ${exitCode}:\n${stderr}`,
    );
  return stdout;
}

function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter((candidate) => candidate !== undefined);
  for (const candidate of candidates) {
    try {
      accessSync(candidate, constants.X_OK);
      return candidate;
    } catch {
      // Try the next known browser location.
    }
  }
  throw new Error(
    "Chrome is required for the browser runtime smoke; set CHROME_PATH",
  );
}
