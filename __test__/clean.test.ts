import { describe, expect, test } from "bun:test";

import { clean } from "../src/_util/clean";

describe("clean", () => {
  test("removes surrounding whitespace", () => {
    // Newlines and tabs are not in the separator set, so without the
    // trailing trim they would survive and break length/format checks.
    expect(clean("988077917\n", " -")).toBe("988077917");
    expect(clean("\t 988077917 ", " -")).toBe("988077917");
    expect(clean("\r\n12 34\r\n", " -")).toBe("1234");
  });

  test("preserves internal characters and removes separators", () => {
    expect(clean("123-456 789", " -")).toBe("123456789");
    expect(clean("a b", "")).toBe("a b");
  });

  test("normalizes unicode separators before stripping", () => {
    // en dash -> ascii hyphen, then removed by the strip set
    expect(clean("123–456", " -")).toBe("123456");
  });
});
