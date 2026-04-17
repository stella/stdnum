import { describe, expect, test } from "bun:test";

import { fi } from "../src";

describe("fi.vat", () => {
  test("valid Finnish VAT", () => {
    const r = fi.vat.validate("FI20774740");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = fi.vat.validate("FI20774741");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("metadata", () => {
    expect(fi.vat.country).toBe("FI");
  });
});

// ─── HETU (Personal ID) ────────────────────

describe("fi.hetu", () => {
  test("valid HETU", () => {
    const r = fi.hetu.validate("131052-308T");
    expect(r.valid).toBe(true);
  });

  test("invalid HETU check char", () => {
    const r = fi.hetu.validate("131052-308U");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = fi.hetu.validate("131052-30T");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(fi.hetu.country).toBe("FI");
    expect(fi.hetu.entityType).toBe("person");
  });
});

// ─── Y-tunnus (Business ID) ──────────────────

describe("fi.ytunnus", () => {
  test("valid Y-tunnus", () => {
    const r = fi.ytunnus.validate("20774740");
    expect(r.valid).toBe(true);
  });

  test("valid with dash separator", () => {
    const r = fi.ytunnus.validate("2077474-0");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = fi.ytunnus.validate("20774741");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = fi.ytunnus.validate("2077474");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds dash", () => {
    expect(fi.ytunnus.format("20774740")).toBe("2077474-0");
  });

  test("metadata", () => {
    expect(fi.ytunnus.country).toBe("FI");
    expect(fi.ytunnus.entityType).toBe("company");
  });
});
