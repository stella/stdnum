import { describe, expect, test } from "bun:test";

import { ch } from "../src";

// ─── UID (Business ID) ─────────────────────

describe("ch.uid", () => {
  test("valid UID", () => {
    const r = ch.uid.validate("CHE100155212");
    expect(r.valid).toBe(true);
  });

  test("valid UID with separators", () => {
    const r = ch.uid.validate("CHE-100.155.212");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = ch.uid.validate("CHE100155213");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = ch.uid.validate("CHE12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("missing CHE prefix", () => {
    const r = ch.uid.validate("ABC100155212");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("format adds separators", () => {
    expect(ch.uid.format("CHE100155212")).toBe(
      "CHE-100.155.212",
    );
  });

  test("metadata", () => {
    expect(ch.uid.country).toBe("CH");
    expect(ch.uid.entityType).toBe("company");
  });
});

// ─── VAT ────────────────────────────────────

describe("ch.vat", () => {
  test("valid VAT with IVA suffix", () => {
    const r = ch.vat.validate("CHE107787577IVA");
    expect(r.valid).toBe(true);
  });

  test("valid VAT with MWST suffix", () => {
    const r = ch.vat.validate("CHE-107.787.577 MWST");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = ch.vat.validate("CHE107787578IVA");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("missing suffix", () => {
    const r = ch.vat.validate("CHE107787577");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("metadata", () => {
    expect(ch.vat.country).toBe("CH");
    expect(ch.vat.entityType).toBe("company");
  });
});

// ─── SSN (AHV) ──────────────────────────────

describe("ch.ssn", () => {
  test("valid SSN", () => {
    const r = ch.ssn.validate("7569217076985");
    expect(r.valid).toBe(true);
  });

  test("valid SSN with separators", () => {
    const r = ch.ssn.validate("756.9217.0769.85");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = ch.ssn.validate("7569217076984");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong prefix", () => {
    const r = ch.ssn.validate("1239217076985");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = ch.ssn.validate("756921707");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds separators", () => {
    expect(ch.ssn.format("7569217076985")).toBe(
      "756.9217.0769.85",
    );
  });

  test("metadata", () => {
    expect(ch.ssn.country).toBe("CH");
    expect(ch.ssn.entityType).toBe("person");
  });
});
