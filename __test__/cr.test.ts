import { describe, expect, test } from "bun:test";

import { cr } from "../src";

describe("cr.cpf", () => {
  test("valid CPF (formatted)", () => {
    const r = cr.cpf.validate("01-0913-0259");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("0109130259");
  });

  test("valid CPF (short format, adds padding)", () => {
    const r = cr.cpf.validate("1-613-584");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("0106130584");
  });

  test("valid CPF (compact 9 digits, prepends 0)", () => {
    const r = cr.cpf.validate("104001311");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("0104001311");
  });

  test("valid CPF (3-prefix formatted)", () => {
    const r = cr.cpf.validate("3-0455-0175");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("0304550175");
  });

  test("wrong length", () => {
    const r = cr.cpf.validate("12345678");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });

  test("non-digit characters", () => {
    const r = cr.cpf.validate("FF84907170");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_FORMAT");
  });

  test("first digit not 0", () => {
    const r = cr.cpf.validate("3012341234");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_COMPONENT");
  });

  test("compact strips spaces", () => {
    expect(cr.cpf.compact("01 0913 0259")).toBe(
      "0109130259",
    );
  });

  test("format adds dashes", () => {
    expect(cr.cpf.format("0109130259")).toBe(
      "01-0913-0259",
    );
  });

  test("metadata", () => {
    expect(cr.cpf.abbreviation).toBe("CPF");
    expect(cr.cpf.country).toBe("CR");
    expect(cr.cpf.entityType).toBe("person");
  });
});
