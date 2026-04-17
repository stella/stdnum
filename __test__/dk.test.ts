import { describe, expect, test } from "bun:test";

import { dk } from "../src";

describe("dk.vat", () => {
  test("valid Danish VAT", () => {
    const r = dk.vat.validate("DK13585628");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = dk.vat.validate("DK13585629");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("cannot start with 0", () => {
    const r = dk.vat.validate("DK01234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("metadata", () => {
    expect(dk.vat.country).toBe("DK");
  });
});

// ─── CPR (Personal ID) ─────────────────────

describe("dk.cpr", () => {
  test("valid CPR", () => {
    const r = dk.cpr.validate("2110625629");
    expect(r.valid).toBe(true);
  });

  test("invalid CPR (bad date)", () => {
    const r = dk.cpr.validate("0000000000");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = dk.cpr.validate("123456789");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds dash", () => {
    expect(dk.cpr.format("2110625629")).toBe("211062-5629");
  });

  test("metadata", () => {
    expect(dk.cpr.country).toBe("DK");
    expect(dk.cpr.entityType).toBe("person");
  });
});

// ─── CVR (Business Register) ─────────────────

describe("dk.cvr", () => {
  test("valid CVR", () => {
    const r = dk.cvr.validate("13585628");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = dk.cvr.validate("13585627");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("cannot start with 0", () => {
    const r = dk.cvr.validate("01234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = dk.cvr.validate("1358562");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("strips separators", () => {
    const r = dk.cvr.validate("13 58 56 28");
    expect(r.valid).toBe(true);
  });

  test("metadata", () => {
    expect(dk.cvr.country).toBe("DK");
    expect(dk.cvr.entityType).toBe("company");
  });
});
