import { describe, expect, test } from "bun:test";

import { ee } from "../src";

describe("ee.vat", () => {
  test("valid Estonian VAT", () => {
    const r = ee.vat.validate("EE100931558");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = ee.vat.validate("EE100931559");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = ee.vat.validate("EE12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(ee.vat.country).toBe("EE");
  });
});

// ─── IK (Isikukood) ────────────────────────

describe("ee.ik", () => {
  test("valid IK", () => {
    const r = ee.ik.validate("36805280109");
    expect(r.valid).toBe(true);
  });

  test("invalid IK checksum", () => {
    const r = ee.ik.validate("36805280108");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = ee.ik.validate("3680528010");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid gender digit", () => {
    const r = ee.ik.validate("96805280109");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("rejects 7/8 century digits not used by the official format", () => {
    const r = ee.ik.validate("76805280109");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("metadata", () => {
    expect(ee.ik.country).toBe("EE");
    expect(ee.ik.entityType).toBe("person");
  });
});

// ─── Registrikood (Company Register) ─────────

describe("ee.registrikood", () => {
  test("valid Registrikood", () => {
    const r = ee.registrikood.validate("12345678");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = ee.registrikood.validate("12345679");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid first digit", () => {
    const r = ee.registrikood.validate("22345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = ee.registrikood.validate("1234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(ee.registrikood.country).toBe("EE");
    expect(ee.registrikood.entityType).toBe("company");
  });
});
