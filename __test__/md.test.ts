import { describe, expect, test } from "bun:test";

import { md } from "../src";

describe("md.idno", () => {
  test("valid IDNO", () => {
    const r = md.idno.validate("1008600038413");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("1008600038413");
    }
  });

  test("invalid checksum", () => {
    const r = md.idno.validate("1008600038412");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = md.idno.validate("100860003841");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = md.idno.validate("100860003841A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("with spaces", () => {
    const r = md.idno.validate("1008 6000 38413");
    expect(r.valid).toBe(true);
  });

  test("generate produces valid IDNO", () => {
    const generated = md.idno.generate!();
    const r = md.idno.validate(generated);
    expect(r.valid).toBe(true);
  });

  test("metadata", () => {
    expect(md.idno.country).toBe("MD");
    expect(md.idno.abbreviation).toBe("IDNO");
    expect(md.idno.entityType).toBe("company");
  });
});
