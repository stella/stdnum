import { describe, expect, test } from "bun:test";

import { es } from "../src";

describe("es.vat", () => {
  test("valid DNI", () => {
    const r = es.vat.validate("ES12345678Z");
    expect(r.valid).toBe(true);
  });

  test("invalid DNI check letter", () => {
    const r = es.vat.validate("ES12345678A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("valid NIE (X prefix)", () => {
    const r = es.vat.validate("ESX5253868R");
    expect(r.valid).toBe(true);
  });

  test("valid NIE (Y prefix)", () => {
    const r = es.vat.validate("ESY1234567X");
    expect(r.valid).toBe(true);
  });

  test("valid CIF (letter check)", () => {
    const r = es.vat.validate("ESQ2876031B");
    expect(r.valid).toBe(true);
  });

  test("valid CIF (digit check)", () => {
    const r = es.vat.validate("ESA78304516");
    expect(r.valid).toBe(true);
  });

  test("wrong length", () => {
    const r = es.vat.validate("ES1234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(es.vat.country).toBe("ES");
    expect(es.vat.entityType).toBe("any");
  });
});

// ─── DNI ────────────────────────────────────

describe("es.dni", () => {
  test("valid DNI", () => {
    const r = es.dni.validate("54362315K");
    expect(r.valid).toBe(true);
  });

  test("invalid DNI check letter", () => {
    const r = es.dni.validate("54362315Z");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = es.dni.validate("5436231K");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(es.dni.country).toBe("ES");
    expect(es.dni.entityType).toBe("person");
  });
});

// ─── NIE ────────────────────────────────────

describe("es.nie", () => {
  test("valid NIE", () => {
    const r = es.nie.validate("X2482300W");
    expect(r.valid).toBe(true);
  });

  test("invalid NIE check letter", () => {
    const r = es.nie.validate("X2482300A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid prefix", () => {
    const r = es.nie.validate("A2482300W");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("metadata", () => {
    expect(es.nie.country).toBe("ES");
    expect(es.nie.entityType).toBe("person");
  });
});
