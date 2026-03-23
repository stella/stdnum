import { describe, expect, test } from "bun:test";

import { al } from "../src";

describe("al.nipt", () => {
  test("valid NIPT", () => {
    const r = al.nipt.validate("J91402501L");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("J91402501L");
  });
  test("valid NIPT with K prefix", () => {
    const r = al.nipt.validate("K22218003V");
    expect(r.valid).toBe(true);
  });
  test("valid with AL prefix and spaces", () => {
    const r = al.nipt.validate("AL J 91402501 L");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("J91402501L");
  });
  test("strips (AL) prefix but invalid length", () => {
    const r = al.nipt.validate("(AL) J 91402501");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });
  test("invalid first letter Z", () => {
    const r = al.nipt.validate("Z22218003V");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_FORMAT");
  });
  test("wrong length", () => {
    const r = al.nipt.validate("J9140250L");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });
  test("compact strips AL prefix", () => {
    expect(al.nipt.compact("AL J 91402501 L")).toBe(
      "J91402501L",
    );
  });
  test("metadata", () => {
    expect(al.nipt.country).toBe("AL");
    expect(al.nipt.entityType).toBe("any");
    expect(al.nipt.abbreviation).toBe("NIPT");
  });
});
