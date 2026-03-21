import { describe, expect, test } from "bun:test";

import { gh } from "../src";

describe("gh.tin", () => {
  test("valid TIN (company)", () => {
    const r = gh.tin.validate("C0000803561");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("C0000803561");
    }
  });

  test("valid with lowercase", () => {
    const r = gh.tin.validate("c0000803561");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("C0000803561");
    }
  });

  test("valid with spaces", () => {
    const r = gh.tin.validate("C 000 080 3561");
    expect(r.valid).toBe(true);
  });

  test("valid with X check digit", () => {
    const r = gh.tin.validate("P000000006X");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("P000000006X");
    }
  });

  test("invalid: wrong length", () => {
    const r = gh.tin.validate("C000080356");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: bad prefix", () => {
    const r = gh.tin.validate("X0000803561");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid: wrong check digit", () => {
    const r = gh.tin.validate("C0000803562");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid: positions 2-3 not 00", () => {
    const r = gh.tin.validate("C1200803561");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid: letters in body positions", () => {
    const r = gh.tin.validate("C00A0803561");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format returns compact uppercase", () => {
    expect(gh.tin.format("c0000803561")).toBe(
      "C0000803561",
    );
  });

  test("metadata", () => {
    expect(gh.tin.abbreviation).toBe("TIN");
    expect(gh.tin.country).toBe("GH");
    expect(gh.tin.entityType).toBe("any");
  });
});
