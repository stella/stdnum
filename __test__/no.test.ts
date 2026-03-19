import { describe, expect, test } from "bun:test";

import { no } from "../src";

// ─── Orgnr (Organization Number) ───────────

describe("no.orgnr", () => {
  test("valid org number", () => {
    const r = no.orgnr.validate("988077917");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = no.orgnr.validate("988 077 917");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = no.orgnr.validate("988077918");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = no.orgnr.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds spaces", () => {
    expect(no.orgnr.format("988077917")).toBe(
      "988 077 917",
    );
  });

  test("metadata", () => {
    expect(no.orgnr.country).toBe("NO");
    expect(no.orgnr.entityType).toBe("company");
  });
});

// ─── MVA (VAT) ──────────────────────────────

describe("no.mva", () => {
  test("valid MVA", () => {
    const r = no.mva.validate("995525828MVA");
    expect(r.valid).toBe(true);
  });

  test("valid with NO prefix", () => {
    const r = no.mva.validate("NO995525828MVA");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = no.mva.validate("995525829MVA");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("missing MVA suffix", () => {
    const r = no.mva.validate("995525828");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("metadata", () => {
    expect(no.mva.country).toBe("NO");
    expect(no.mva.entityType).toBe("company");
  });
});

// ─── Fødselsnummer (Birth Number) ───────────

describe("no.fodselsnummer", () => {
  test("valid birth number", () => {
    const r = no.fodselsnummer.validate("15108695088");
    expect(r.valid).toBe(true);
  });

  test("valid with separator", () => {
    const r = no.fodselsnummer.validate("151086 95088");
    expect(r.valid).toBe(true);
  });

  test("invalid check digit", () => {
    const r = no.fodselsnummer.validate("15108695077");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = no.fodselsnummer.validate("1510869508");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds space", () => {
    expect(no.fodselsnummer.format("15108695088")).toBe(
      "151086 95088",
    );
  });

  test("metadata", () => {
    expect(no.fodselsnummer.country).toBe("NO");
    expect(no.fodselsnummer.entityType).toBe("person");
  });
});
