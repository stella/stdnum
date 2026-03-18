import { describe, expect, test } from "bun:test";

import { it } from "../src";

describe("it.iva", () => {
  test("valid Partita IVA", () => {
    const r = it.iva.validate("00743110157");
    expect(r.valid).toBe(true);
  });

  test("valid with IT prefix", () => {
    const r = it.iva.validate("IT00743110157");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = it.iva.validate("00743110158");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid: all zeros company ID", () => {
    const r = it.iva.validate("00000001001");
    expect(r.valid).toBe(false);
  });

  test("format adds IT prefix", () => {
    expect(it.iva.format("00743110157")).toBe(
      "IT00743110157",
    );
  });

  test("metadata", () => {
    expect(it.iva.abbreviation).toBe("P.IVA");
    expect(it.iva.country).toBe("IT");
  });
});

describe("it.codiceFiscale", () => {
  test("valid Codice Fiscale", () => {
    const r = it.codiceFiscale.validate("RCCMNL83S18D969H");
    expect(r.valid).toBe(true);
  });

  test("invalid check letter", () => {
    const r = it.codiceFiscale.validate("RCCMNL83S18D967H");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("case insensitive", () => {
    const r = it.codiceFiscale.validate("rccmnl83s18d969h");
    expect(r.valid).toBe(true);
  });

  test("11-digit delegates to IVA", () => {
    const r = it.codiceFiscale.validate("00743110157");
    expect(r.valid).toBe(true);
  });

  test("wrong length", () => {
    const r = it.codiceFiscale.validate("RCCMNL83S18D96");
    expect(r.valid).toBe(false);
  });

  test("metadata", () => {
    expect(it.codiceFiscale.abbreviation).toBe("CF");
    expect(it.codiceFiscale.country).toBe("IT");
    expect(it.codiceFiscale.entityType).toBe("person");
  });
});
