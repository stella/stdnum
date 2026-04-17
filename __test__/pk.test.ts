import { describe, expect, test } from "bun:test";

import { pk } from "../src";

// ─── CNIC (Computerized National Identity Card) ─

describe("pk.cnic", () => {
  test("valid CNIC", () => {
    const r = pk.cnic.validate("3520112345671");
    expect(r.valid).toBe(true);
  });

  test("valid with dashes", () => {
    const r = pk.cnic.validate("35201-1234567-1");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = pk.cnic.validate("35201 1234567 1");
    expect(r.valid).toBe(true);
  });

  test("valid even gender digit (female)", () => {
    const r = pk.cnic.validate("4210112345672");
    expect(r.valid).toBe(true);
  });

  test("wrong length (too short)", () => {
    const r = pk.cnic.validate("352011234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("wrong length (too long)", () => {
    const r = pk.cnic.validate("35201123456712");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = pk.cnic.validate("3520112345A71");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("province code all zeros", () => {
    const r = pk.cnic.validate("0000012345671");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("format adds dashes", () => {
    expect(pk.cnic.format("3520112345671")).toBe(
      "35201-1234567-1",
    );
  });

  test("compact strips separators", () => {
    expect(pk.cnic.compact("35201-1234567-1")).toBe(
      "3520112345671",
    );
  });

  test("metadata", () => {
    expect(pk.cnic.abbreviation).toBe("CNIC");
    expect(pk.cnic.country).toBe("PK");
    expect(pk.cnic.entityType).toBe("person");
  });
});
