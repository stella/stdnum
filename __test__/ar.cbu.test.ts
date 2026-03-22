import { describe, expect, test } from "bun:test";

import { ar } from "../src";

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
    // Change digit at pos 7
    const r = ar.cbu.validate("2850590040090418135201");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid second check digit", () => {
    // Change last digit
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
