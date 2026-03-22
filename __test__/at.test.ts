import { describe, expect, test } from "bun:test";

import { at } from "../src";

describe("at.uid", () => {
  test("valid UID", () => {
    const r = at.uid.validate("ATU13585627");
    expect(r.valid).toBe(true);
  });

  test("valid without prefix", () => {
    const r = at.uid.validate("U13585627");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = at.uid.validate("U13585626");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = at.uid.validate("U1358562");
    expect(r.valid).toBe(false);
  });

  test("must start with U", () => {
    const r = at.uid.validate("X13585627");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("format adds AT prefix", () => {
    expect(at.uid.format("U13585627")).toBe("ATU13585627");
  });

  test("metadata", () => {
    expect(at.uid.abbreviation).toBe("UID");
    expect(at.uid.country).toBe("AT");
    expect(at.uid.entityType).toBe("company");
  });
});

// ─── Firmenbuchnummer (Business ID) ──────────

describe("at.businessid", () => {
  test("valid with FN prefix", () => {
    const r = at.businessid.validate("FN 122119m");
    expect(r.valid).toBe(true);
  });

  test("valid without prefix", () => {
    const r = at.businessid.validate("122119m");
    expect(r.valid).toBe(true);
  });

  test("normalizes trailing letter to lowercase", () => {
    const r = at.businessid.validate("122119M");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("122119m");
    }
  });

  test("invalid: letter before digits", () => {
    const r = at.businessid.validate("m123123");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("too short", () => {
    const r = at.businessid.validate("m");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds FN prefix", () => {
    expect(at.businessid.format("122119m")).toBe(
      "FN 122119m",
    );
  });

  test("metadata", () => {
    expect(at.businessid.country).toBe("AT");
    expect(at.businessid.entityType).toBe("company");
  });
});

// ─── TIN (Abgabenkontonummer) ─────────────────

describe("at.tin", () => {
  test("valid TIN", () => {
    const r = at.tin.validate("591199013");
    expect(r.valid).toBe(true);
  });

  test("valid with separators", () => {
    const r = at.tin.validate("59-119901/3");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = at.tin.validate("591199014");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = at.tin.validate("59119901");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit", () => {
    const r = at.tin.validate("59119901A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format groups as 2-6-1", () => {
    expect(at.tin.format("591199013")).toBe(
      "59-119901/3",
    );
  });

  test("metadata", () => {
    expect(at.tin.country).toBe("AT");
    expect(at.tin.entityType).toBe("any");
  });
});

// ─── VNR (Versicherungsnummer) ──────────────

describe("at.vnr", () => {
  test("valid VNR", () => {
    const r = at.vnr.validate("1237010180");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("1237010180");
  });

  test("valid with spaces", () => {
    const r = at.vnr.validate("1237 010180");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = at.vnr.validate("1238010180");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = at.vnr.validate("123701018");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = at.vnr.validate("123701018A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid birth date (month > 12)", () => {
    const r = at.vnr.validate("1237011380");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid birth date (day 0)", () => {
    const r = at.vnr.validate("1237000180");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("format adds space", () => {
    expect(at.vnr.format("1237010180")).toBe(
      "1237 010180",
    );
  });

  test("metadata", () => {
    expect(at.vnr.abbreviation).toBe("VNR");
    expect(at.vnr.country).toBe("AT");
    expect(at.vnr.entityType).toBe("person");
  });

  test("examples are all valid", () => {
    for (const ex of at.vnr.examples ?? []) {
      const r = at.vnr.validate(ex);
      expect(r.valid).toBe(true);
    }
  });
});
