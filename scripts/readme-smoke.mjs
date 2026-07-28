import { spawnSync } from "node:child_process";
import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const readme = await readFile(
  join(root, "README.md"),
  "utf8",
);
const executable = [
  ...readme.matchAll(/```typescript\n([\s\S]*?)```/gu),
]
  .map((match) => match[1])
  .filter((source) =>
    source?.includes('from "@stll/stdnum'),
  );

const expectedExecutableExamples = 6;
if (executable.length !== expectedExecutableExamples) {
  throw new Error(
    `README executable example count drifted: ${String(executable.length)} != ${String(expectedExecutableExamples)}`,
  );
}

const temporary = await mkdtemp(
  join(root, "scripts", ".readme-smoke-"),
);
try {
  for (const [index, source] of executable.entries()) {
    const path = join(
      temporary,
      `example-${String(index)}.ts`,
    );
    const localSource = source
      .replaceAll(
        '"@stll/stdnum/browser"',
        '"../../packages/stdnum/dist/runtime-browser.js"',
      )
      .replaceAll(
        '"@stll/stdnum-wasm"',
        '"../../packages/stdnum-wasm/dist/index.js"',
      )
      .replaceAll(
        '"@stll/stdnum"',
        '"../../packages/stdnum/dist/index.js"',
      )
      .replaceAll(
        /"@stll\/stdnum\/([^"/]+(?:\/[^"/]+)*)"/gu,
        '"../../packages/stdnum/dist/$1.js"',
      );
    await writeFile(path, localSource);
    const result = spawnSync("bun", [path], {
      cwd: root,
      encoding: "utf8",
    });
    if (result.status !== 0) {
      throw new Error(
        `README TypeScript example ${String(index + 1)} failed:\n${result.stderr}`,
      );
    }
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}

console.log(
  `README smoke passed (${String(executable.length)} executable TypeScript examples).`,
);
