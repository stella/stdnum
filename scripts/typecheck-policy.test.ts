import { expect, test } from "bun:test";

import rootPackage from "../package.json";

const bunTypecheck =
  "bun check --no-pretty --all --project=tsconfig.json";
const packagePaths = rootPackage.workspaces.flatMap(
  (pattern) => [
    ...new Bun.Glob(`${pattern}/package.json`).scanSync(),
  ],
);

test("typecheck and parity cover every workspace configuration", async () => {
  const typecheckDirectories = [];
  for (const path of packagePaths) {
    const packageJson = await Bun.file(path).json();
    const typecheck = packageJson.scripts?.typecheck;
    if (typecheck === undefined) continue;
    expect(typecheck).toBe(bunTypecheck);
    expect(
      packageJson.scripts["check:typecheck-parity"],
    ).toBe("stll-typecheck-parity");
    typecheckDirectories.push(
      path.replace(/\/package\.json$/, ""),
    );
  }
  const typecheckCommands =
    rootPackage.scripts.typecheck.split(" && ");
  expect(typecheckCommands.shift()).toBe(bunTypecheck);
  const parityCommands =
    rootPackage.scripts["check:typecheck-parity"].split(
      " && ",
    );
  expect(parityCommands.shift()).toBe(
    "bun test scripts/typecheck-policy.test.ts",
  );
  expect(parityCommands.shift()).toBe(
    "stll-typecheck-parity",
  );
  expect(
    typecheckCommands.toSorted((left, right) =>
      left.localeCompare(right),
    ),
  ).toEqual(
    typecheckDirectories
      .map((path) => `bun run --cwd ${path} typecheck`)
      .toSorted((left, right) => left.localeCompare(right)),
  );
  expect(
    parityCommands.toSorted((left, right) =>
      left.localeCompare(right),
    ),
  ).toEqual(
    typecheckDirectories
      .map(
        (path) =>
          `bun run --cwd ${path} check:typecheck-parity`,
      )
      .toSorted((left, right) => left.localeCompare(right)),
  );
});

test("optional compiler and mutation proofs run only on demand", async () => {
  const readWorkflow = async (name: string) =>
    Bun.YAML.parse(
      await Bun.file(
        new URL(
          `../.github/workflows/${name}.yml`,
          import.meta.url,
        ),
      ).text(),
    );
  const proofs = await readWorkflow("typecheck-proofs");
  expect(Object.keys(proofs.on)).toEqual([
    "workflow_dispatch",
  ]);
  expect(proofs.permissions).toEqual({ contents: "read" });
  expect(
    proofs.jobs["typecheck-parity"].steps
      .map((step: { run?: string }) => step.run)
      .filter(Boolean),
  ).toEqual([
    "bun install --frozen-lockfile",
    "bun run check:toolchain",
    "bun run check:typecheck-parity",
  ]);
  const workflow = await readWorkflow("ci");
  expect(JSON.stringify(workflow.jobs)).not.toContain(
    "bun run check:typecheck-parity",
  );
  const mutants = await readWorkflow("mutants");
  expect(Object.keys(mutants.on)).toEqual([
    "workflow_dispatch",
  ]);
});
