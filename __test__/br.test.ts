import { describe, expect, test } from "bun:test";

import { br } from "../src";

// ─── CPF ──────────────────────────────────────

describe("br.cpf", () => {
  test("valid CPF with separators", () => {
    const r = br.cpf.validate("390.533.447-05");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("39053344705");
    }
  });

  test("valid CPF without separators", () => {
    const r = br.cpf.validate("39053344705");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = br.cpf.validate("231.002.999-00");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = br.cpf.validate("1234567890");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    // '=' is not stripped by clean; the result has
    // 11 chars but is not all digits
    const r = br.cpf.validate("390.533.447=0");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("all zeros rejected", () => {
    const r = br.cpf.validate("000.000.000-00");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("all same digits rejected", () => {
    // 111.111.111-11 passes checksum but is invalid
    const r = br.cpf.validate("111.111.111-11");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format adds separators", () => {
    expect(br.cpf.format("39053344705")).toBe(
      "390.533.447-05",
    );
  });

  test("compact strips separators", () => {
    expect(br.cpf.compact("390.533.447-05")).toBe(
      "39053344705",
    );
  });

  test("metadata", () => {
    expect(br.cpf.abbreviation).toBe("CPF");
    expect(br.cpf.country).toBe("BR");
    expect(br.cpf.entityType).toBe("person");
  });

  test("examples are all valid", () => {
    for (const ex of br.cpf.examples ?? []) {
      const r = br.cpf.validate(ex);
      expect(r.valid).toBe(true);
    }
  });
});

// ─── CNPJ ─────────────────────────────────────

describe("br.cnpj", () => {
  test("valid CNPJ with separators (Petrobras)", () => {
    const r = br.cnpj.validate("33.000.167/0001-01");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("33000167000101");
    }
  });

  test("valid CNPJ without separators (Banco do Brasil)", () => {
    const r = br.cnpj.validate("00000000000191");
    expect(r.valid).toBe(true);
  });

  test("valid CNPJ: 16.727.230/0001-97", () => {
    const r = br.cnpj.validate("16.727.230/0001-97");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = br.cnpj.validate("16.727.230/0001-98");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = br.cnpj.validate("1672723000019");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("all-zero base rejected", () => {
    const r = br.cnpj.validate("00.000.000.0000-00");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid delimiter rejected", () => {
    // '=' is not stripped by compact, so the result
    // has 15 chars and fails the length check.
    const r = br.cnpj.validate("16.727.230/0001=97");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("alphanumeric CNPJ (post-July 2026 format)", () => {
    // From python-stdnum: '12. ABC.345 /01DE-35'
    const r = br.cnpj.validate("12ABC34501DE35");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("12ABC34501DE35");
    }
  });

  test("format adds separators", () => {
    expect(br.cnpj.format("33000167000101")).toBe(
      "33.000.167/0001-01",
    );
  });

  test("compact strips separators and uppercases", () => {
    expect(br.cnpj.compact("12. ABC.345 /01DE-35")).toBe(
      "12ABC34501DE35",
    );
  });

  test("metadata", () => {
    expect(br.cnpj.abbreviation).toBe("CNPJ");
    expect(br.cnpj.country).toBe("BR");
    expect(br.cnpj.entityType).toBe("company");
  });

  test("examples are all valid", () => {
    for (const ex of br.cnpj.examples ?? []) {
      const r = br.cnpj.validate(ex);
      expect(r.valid).toBe(true);
    }
  });
});
