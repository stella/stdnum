import { describe, expect, test } from "bun:test";

import { se } from "../src";

describe("se.vat", () => {
  test("valid Swedish VAT", () => {
    const r = se.vat.validate("SE556188840401");
    expect(r.valid).toBe(true);
  });

  test("must end with 01", () => {
    const r = se.vat.validate("SE556188840402");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid Luhn", () => {
    const r = se.vat.validate("SE556188840501");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("metadata", () => {
    expect(se.vat.country).toBe("SE");
  });
});

// ─── Personnummer (Personal ID) ─────────────

describe("se.personnummer", () => {
  test("valid Personnummer", () => {
    const r = se.personnummer.validate("8803200016");
    expect(r.valid).toBe(true);
  });

  test("invalid Personnummer Luhn", () => {
    const r = se.personnummer.validate("8803200018");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = se.personnummer.validate("880320001");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds dash", () => {
    expect(se.personnummer.format("8803200016")).toBe(
      "880320-0016",
    );
  });

  test("metadata", () => {
    expect(se.personnummer.country).toBe("SE");
    expect(se.personnummer.entityType).toBe("person");
  });
});
