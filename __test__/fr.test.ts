import { describe, expect, test } from "bun:test";

import { fr } from "../src";

describe("fr.siren", () => {
  test("valid SIREN", () => {
    const r = fr.siren.validate("552008443");
    expect(r.valid).toBe(true);
  });

  test("valid: 404833048", () => {
    const r = fr.siren.validate("404833048");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = fr.siren.validate("552008442");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("format", () => {
    expect(fr.siren.format("552008443")).toBe(
      "552 008 443",
    );
  });

  test("metadata", () => {
    expect(fr.siren.abbreviation).toBe("SIREN");
    expect(fr.siren.country).toBe("FR");
  });
});

describe("fr.siret", () => {
  test("valid SIRET", () => {
    const r = fr.siret.validate("73282932000074");
    expect(r.valid).toBe(true);
  });

  test("valid La Poste", () => {
    const r = fr.siret.validate("35600000000048");
    expect(r.valid).toBe(true);
  });

  test("valid La Poste variant", () => {
    const r = fr.siret.validate("35600000049837");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = fr.siret.validate("73282932000075");
    expect(r.valid).toBe(false);
  });

  test("wrong length", () => {
    const r = fr.siret.validate("7328293200");
    expect(r.valid).toBe(false);
  });

  test("metadata", () => {
    expect(fr.siret.abbreviation).toBe("SIRET");
  });
});

describe("fr.nif", () => {
  test("valid NIF", () => {
    const r = fr.nif.validate("3023217600053");
    expect(r.valid).toBe(true);
  });

  test("valid: 0701987765493", () => {
    const r = fr.nif.validate("0701987765493");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = fr.nif.validate("3023217600054");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid: starts with 9", () => {
    const r = fr.nif.validate("9701987765432");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("all zeros is valid (0 % 511 == 0)", () => {
    const r = fr.nif.validate("0000000000000");
    expect(r.valid).toBe(true);
  });

  test("metadata", () => {
    expect(fr.nif.abbreviation).toBe("NIF");
    expect(fr.nif.entityType).toBe("person");
  });
});

describe("fr.tva", () => {
  test("valid old-style (numeric prefix)", () => {
    const r = fr.tva.validate("FR40303265045");
    expect(r.valid).toBe(true);
  });

  test("valid: 23334175221", () => {
    const r = fr.tva.validate("23334175221");
    expect(r.valid).toBe(true);
  });

  test("valid new-style (letter prefix)", () => {
    const r = fr.tva.validate("K7399859412");
    expect(r.valid).toBe(true);
  });

  test("valid mixed prefix", () => {
    const r = fr.tva.validate("4Z123456782");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = fr.tva.validate("84323140391");
    expect(r.valid).toBe(false);
  });

  test("metadata", () => {
    expect(fr.tva.abbreviation).toBe("TVA");
    expect(fr.tva.country).toBe("FR");
  });
});
