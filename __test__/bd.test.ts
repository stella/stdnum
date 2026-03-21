import { describe, expect, test } from "bun:test";

import { bd } from "../src";

// ─── NID (National Identity Number) ─────────────

describe("bd.nid", () => {
  // ── 13-digit (old format) ──────────────────────

  test("valid 13-digit NID", () => {
    const r = bd.nid.validate("1592824588424");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("1592824588424");
    }
  });

  test("valid 13-digit: identique vector", () => {
    const r = bd.nid.validate("2610413965404");
    expect(r.valid).toBe(true);
  });

  // ── 17-digit (new format) ─────────────────────

  test("valid 17-digit NID", () => {
    const r = bd.nid.validate("19841592824588424");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("19841592824588424");
    }
  });

  test("valid 17-digit: identique vector", () => {
    const r = bd.nid.validate("19892610413965404");
    expect(r.valid).toBe(true);
  });

  // ── 10-digit (smart card) ─────────────────────

  test("valid 10-digit smart card NID", () => {
    const r = bd.nid.validate("1234567890");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("1234567890");
    }
  });

  test("invalid 10-digit: starts with 0", () => {
    const r = bd.nid.validate("0123456789");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  // ── Invalid cases ─────────────────────────────

  test("invalid: wrong length", () => {
    const r = bd.nid.validate("159282458842");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: 16 digits", () => {
    const r = bd.nid.validate("1984159282458844");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: contains letters", () => {
    const r = bd.nid.validate("159282458842A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid 13-digit: bad RMO code", () => {
    // RMO digit (3rd) = 0 is not valid
    const r = bd.nid.validate("1500024588424");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid 17-digit: bad RMO code", () => {
    // RMO digit at position 6 (0-indexed) = 0
    const r = bd.nid.validate("19841500024588424");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("valid with separators stripped", () => {
    const r = bd.nid.validate("159-2824-588424");
    expect(r.valid).toBe(true);
  });

  test("compact strips separators", () => {
    expect(bd.nid.compact("159-2824-588424")).toBe(
      "1592824588424",
    );
  });

  test("metadata", () => {
    expect(bd.nid.abbreviation).toBe("NID");
    expect(bd.nid.country).toBe("BD");
    expect(bd.nid.entityType).toBe("person");
  });
});
