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

// ─── NSS (Social Security Number) ───────────

describe("es.nss", () => {
  test("valid NSS (affiliate >= 10M)", () => {
    const r = es.nss.validate("281234567840");
    expect(r.valid).toBe(true);
  });

  test("valid NSS (affiliate < 10M)", () => {
    const r = es.nss.validate("080123456774");
    expect(r.valid).toBe(true);
  });

  test("valid with separators", () => {
    const r = es.nss.validate("28/12345678/40");
    expect(r.valid).toBe(true);
  });

  test("wrong length", () => {
    const r = es.nss.validate("2812345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = es.nss.validate("28123456AB40");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid province code (00)", () => {
    const r = es.nss.validate("001234567800");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid province code (53)", () => {
    const r = es.nss.validate("531234567800");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid check digits", () => {
    const r = es.nss.validate("281234567841");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("format adds slashes", () => {
    expect(es.nss.format("281234567840")).toBe(
      "28/12345678/40",
    );
  });

  test("metadata", () => {
    expect(es.nss.abbreviation).toBe("NSS");
    expect(es.nss.country).toBe("ES");
    expect(es.nss.entityType).toBe("person");
  });
});

// ─── CIF (Company Tax ID) ───────────────────

describe("es.cif", () => {
  test("valid CIF", () => {
    const r = es.cif.validate("A13585625");
    expect(r.valid).toBe(true);
  });

  test("invalid CIF", () => {
    const r = es.cif.validate("J99216583");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = es.cif.validate("A1234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid prefix", () => {
    const r = es.cif.validate("X12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("strips ES prefix", () => {
    const r = es.cif.validate("ESA13585625");
    expect(r.valid).toBe(true);
  });

  test("metadata", () => {
    expect(es.cif.country).toBe("ES");
    expect(es.cif.entityType).toBe("company");
  });
});
