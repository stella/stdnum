import { describe, expect, test } from "bun:test";

import { ar } from "../src";

// ─── CUIT ────────────────────────────────────

describe("ar.cuit", () => {
  test("valid CUIT with separators", () => {
    const r = ar.cuit.validate("20-26756539-3");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("20267565393");
    }
  });

  test("valid CUIT without separators", () => {
    const r = ar.cuit.validate("20267565393");
    expect(r.valid).toBe(true);
  });

  test("valid company CUIT (type 30)", () => {
    const r = ar.cuit.validate("30-10000001-2");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("30100000012");
    }
  });

  test("valid CUIT with spaces", () => {
    const r = ar.cuit.validate("20 26756539 3");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = ar.cuit.validate("20267565394");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = ar.cuit.validate("2026756539");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = ar.cuit.validate("2026756539A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("valid international CUIT (type 50)", () => {
    const r = ar.cuit.validate("50000000016");
    expect(r.valid).toBe(true);
  });

  test("valid CUIT where sum % 11 === 1 (check digit 9)", () => {
    // Body "2000000001": sum=12, 12%11=1, remainder=10 -> check=9.
    // python-stdnum accepts this ('012345678990'[10] = '9').
    const r = ar.cuit.validate("20000000019");
    expect(r.valid).toBe(true);
  });

  test("invalid type code", () => {
    const r = ar.cuit.validate("11267565393");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("format adds separators", () => {
    expect(ar.cuit.format("20267565393")).toBe(
      "20-26756539-3",
    );
  });

  test("compact strips separators", () => {
    expect(ar.cuit.compact("20-26756539-3")).toBe(
      "20267565393",
    );
  });

  test("metadata", () => {
    expect(ar.cuit.abbreviation).toBe("CUIT");
    expect(ar.cuit.country).toBe("AR");
    expect(ar.cuit.entityType).toBe("any");
  });

  test("examples are all valid", () => {
    for (const ex of ar.cuit.examples ?? []) {
      const r = ar.cuit.validate(ex);
      expect(r.valid).toBe(true);
    }
  });
});

// ─── DNI ────────────────────────────────────

describe("ar.dni", () => {
  test("valid 8-digit DNI", () => {
    const r = ar.dni.validate("12345678");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("12345678");
  });

  test("valid 7-digit DNI", () => {
    const r = ar.dni.validate("1234567");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("1234567");
  });

  test("valid with dots", () => {
    const r = ar.dni.validate("12.345.678");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("12345678");
  });

  test("valid 7-digit with dots", () => {
    const r = ar.dni.validate("1.234.567");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("1234567");
  });

  test("too short (6 digits)", () => {
    const r = ar.dni.validate("123456");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("too long (9 digits)", () => {
    const r = ar.dni.validate("123456789");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = ar.dni.validate("1234567A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format 8-digit", () => {
    expect(ar.dni.format("12345678")).toBe("12.345.678");
  });

  test("format 7-digit", () => {
    expect(ar.dni.format("1234567")).toBe("1.234.567");
  });

  test("metadata", () => {
    expect(ar.dni.abbreviation).toBe("DNI");
    expect(ar.dni.country).toBe("AR");
    expect(ar.dni.entityType).toBe("person");
  });

  test("examples are all valid", () => {
    for (const ex of ar.dni.examples ?? []) {
      const r = ar.dni.validate(ex);
      expect(r.valid).toBe(true);
    }
  });
});

// ─── CBU ────────────────────────────────────

describe("ar.cbu", () => {
  test("valid CBU", () => {
    const r = ar.cbu.validate("2850590940090418135201");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("2850590940090418135201");
    }
  });

  test("valid CBU with spaces", () => {
    const r = ar.cbu.validate(
      "28505909 40090418135201",
    );
    expect(r.valid).toBe(true);
  });

  test("wrong length", () => {
    const r = ar.cbu.validate("285059094009041813520");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = ar.cbu.validate("285059094009041813520A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid first check digit", () => {
    const r = ar.cbu.validate("2850590040090418135201");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid second check digit", () => {
    const r = ar.cbu.validate("2850590940090418135202");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("format splits blocks", () => {
    expect(ar.cbu.format("2850590940090418135201")).toBe(
      "28505909 40090418135201",
    );
  });

  test("metadata", () => {
    expect(ar.cbu.abbreviation).toBe("CBU");
    expect(ar.cbu.country).toBe("AR");
  });

  test("examples are all valid", () => {
    for (const ex of ar.cbu.examples ?? []) {
      const r = ar.cbu.validate(ex);
      expect(r.valid).toBe(true);
    }
  });
});
