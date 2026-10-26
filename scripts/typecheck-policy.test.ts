import { expect, test } from "bun:test";

import rootPackage from "../package.json";

const bunTypecheck = "bun check --no-pretty --all --project=tsconfig.json";
const packagePaths = rootPackage.workspaces.flatMap((pattern) => [
  ...new Bun.Glob(`${pattern}/package.json`).scanSync(),
]);

test("typecheck covers every workspace configuration", async () => {
  const typecheckDirectories = [];
  for (const path of packagePaths) {
    const packageJson = await Bun.file(path).json();
    const typecheck = packageJson.scripts?.typecheck;
    if (typecheck === undefined) continue;
    expect(typecheck).toBe(bunTypecheck);
    typecheckDirectories.push(path.replace(/\/package\.json$/, ""));
  }
  const typecheckCommands = rootPackage.scripts.typecheck.split(" && ");
  expect(typecheckCommands.shift()).toBe(bunTypecheck);
  expect(
    typecheckCommands.toSorted((left, right) => left.localeCompare(right)),
  ).toEqual(
    typecheckDirectories
      .map((path) => `bun run --cwd ${path} typecheck`)
      .toSorted((left, right) => left.localeCompare(right)),
  );
});
