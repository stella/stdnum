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
