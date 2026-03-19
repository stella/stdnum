import { describe, expect, test } from "bun:test";

import { nl } from "../src";

describe("nl.vat", () => {
  test("valid Dutch VAT", () => {
    const r = nl.vat.validate("NL123456789B13");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = nl.vat.validate("NL123456789B14");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("missing B", () => {
    const r = nl.vat.validate("NL123456789A13");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = nl.vat.validate("NL12345678B0");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(nl.vat.country).toBe("NL");
  });
});

// ─── BSN (Citizen Service Number) ──────────

describe("nl.bsn", () => {
  test("valid BSN", () => {
    const r = nl.bsn.validate("111222333");
    expect(r.valid).toBe(true);
  });

  test("invalid BSN checksum", () => {
    const r = nl.bsn.validate("111252333");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = nl.bsn.validate("12345678901");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(nl.bsn.country).toBe("NL");
    expect(nl.bsn.entityType).toBe("person");
  });
});

// ─── KvK (Chamber of Commerce) ───────────────

describe("nl.kvk", () => {
  test("valid KvK number", () => {
    const r = nl.kvk.validate("12345678");
    expect(r.valid).toBe(true);
  });

  test("too short", () => {
    const r = nl.kvk.validate("1234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("too long", () => {
    const r = nl.kvk.validate("123456789");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = nl.kvk.validate("1234567A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("metadata", () => {
    expect(nl.kvk.country).toBe("NL");
    expect(nl.kvk.entityType).toBe("company");
  });
});
