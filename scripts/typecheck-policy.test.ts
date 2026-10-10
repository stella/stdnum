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
