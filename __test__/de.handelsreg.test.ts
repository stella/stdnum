import { describe, expect, test } from "bun:test";

import { de } from "../src";

describe("de.handelsreg", () => {
  test("valid HRB number", () => {
    const r = de.handelsreg.validate("HRB 12345");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("HRB 12345");
  });

  test("valid HRA number", () => {
    const r = de.handelsreg.validate("HRA 54321");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("HRA 54321");
  });

  test("valid without space", () => {
    const r = de.handelsreg.validate("HRB12345");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("HRB 12345");
  });

  test("valid lowercase", () => {
    const r = de.handelsreg.validate("hrb 12345");
    expect(r.valid).toBe(true);
  });

  test("valid GnR register", () => {
    const r = de.handelsreg.validate("GnR 789");
    expect(r.valid).toBe(true);
  });

  test("valid VR register", () => {
    const r = de.handelsreg.validate("VR 1234");
    expect(r.valid).toBe(true);
  });

  test("valid PR register", () => {
    const r = de.handelsreg.validate("PR 567");
    expect(r.valid).toBe(true);
  });

  test("invalid: no register type", () => {
    const r = de.handelsreg.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid: unknown register type", () => {
    const r = de.handelsreg.validate("HRC 12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("number too long (8 digits)", () => {
    const r = de.handelsreg.validate("HRB 12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format normalizes", () => {
    expect(de.handelsreg.format("hrb12345")).toBe(
      "HRB 12345",
    );
  });

  test("metadata", () => {
    expect(de.handelsreg.country).toBe("DE");
    expect(de.handelsreg.entityType).toBe("company");
  });

  test("examples are all valid", () => {
    for (const ex of de.handelsreg.examples ?? []) {
      const r = de.handelsreg.validate(ex);
      expect(r.valid).toBe(true);
    }
  });
});
