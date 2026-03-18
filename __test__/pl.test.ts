import { describe, expect, test } from "bun:test";

import { pl } from "../src";

// ─── NIP ─────────────────────────────────────

describe("pl.nip", () => {
  test("valid NIP", () => {
    const r = pl.nip.validate("PL 8567346215");
    expect(r.valid).toBe(true);
  });

  test("valid without prefix", () => {
    const r = pl.nip.validate("8567346215");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = pl.nip.validate("PL 8567346216");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid checksum: 0000002000", () => {
    const r = pl.nip.validate("0000002000");
    expect(r.valid).toBe(false);
  });

  test("wrong length", () => {
    const r = pl.nip.validate("12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds PL prefix", () => {
    expect(pl.nip.format("8567346215")).toBe(
      "PL8567346215",
    );
  });

  test("metadata", () => {
    expect(pl.nip.abbreviation).toBe("NIP");
    expect(pl.nip.country).toBe("PL");
    expect(pl.nip.entityType).toBe("company");
  });
});

// ─── PESEL ───────────────────────────────────

describe("pl.pesel", () => {
  test("valid PESEL", () => {
    const r = pl.pesel.validate("44051401359");
    expect(r.valid).toBe(true);
  });

  test("valid 21st century", () => {
    const r = pl.pesel.validate("09222509560");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = pl.pesel.validate("44051401358");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = pl.pesel.validate("12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(pl.pesel.abbreviation).toBe("PESEL");
    expect(pl.pesel.country).toBe("PL");
    expect(pl.pesel.entityType).toBe("person");
  });
});

// ─── REGON ───────────────────────────────────

describe("pl.regon", () => {
  test("valid 9-digit REGON", () => {
    const r = pl.regon.validate("192598184");
    expect(r.valid).toBe(true);
  });

  test("valid 9-digit: 123456785", () => {
    const r = pl.regon.validate("123456785");
    expect(r.valid).toBe(true);
  });

  test("valid 14-digit REGON", () => {
    const r = pl.regon.validate("12345678512347");
    expect(r.valid).toBe(true);
  });

  test("invalid 9-digit checksum", () => {
    const r = pl.regon.validate("192598183");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid 14-digit base checksum", () => {
    const r = pl.regon.validate("12345678612342");
    expect(r.valid).toBe(false);
  });

  test("invalid 14-digit extension checksum", () => {
    const r = pl.regon.validate("12345678512348");
    expect(r.valid).toBe(false);
  });

  test("wrong length", () => {
    const r = pl.regon.validate("12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(pl.regon.abbreviation).toBe("REGON");
    expect(pl.regon.country).toBe("PL");
    expect(pl.regon.entityType).toBe("company");
  });
});
