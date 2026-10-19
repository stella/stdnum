import { expect, test } from "bun:test";

const ciPath = ".github/workflows/ci.yml";
const claPath = ".github/workflows/cla.yml";

test("the aggregate result covers every CI job", async () => {
  const workflow = Bun.YAML.parse(
    await Bun.file(ciPath).text(),
  );
  const jobs = workflow.jobs;
  const aggregate = jobs["ci-result"];
  const validationJobs = Object.keys(jobs).filter(
    (job) => job !== "ci-result",
  );

  expect(aggregate.if).toBe("always()");
  expect(aggregate.needs.toSorted()).toEqual(
    validationJobs.toSorted(),
  );
});

test.each([ciPath, claPath])(
  "%s handles merge groups",
  async (path) => {
    const workflow = Bun.YAML.parse(
      await Bun.file(path).text(),
    );

    expect(workflow.on.merge_group.types).toEqual([
      "checks_requested",
    ]);
  },
);
