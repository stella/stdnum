import { describe, expect, test } from "bun:test";

import { bg } from "../src";

describe("bg.vat", () => {
  test("valid 9-digit Bulgarian VAT", () => {
    const r = bg.vat.validate("BG175074752");
    expect(r.valid).toBe(true);
  });

  test("valid 10-digit Bulgarian VAT", () => {
    const r = bg.vat.validate("BG7523169263");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum 9-digit", () => {
    const r = bg.vat.validate("BG175074753");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = bg.vat.validate("BG12345678901");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(bg.vat.country).toBe("BG");
  });
});

// ─── EGN (Personal ID) ─────────────────────

describe("bg.egn", () => {
  test("valid EGN", () => {
    const r = bg.egn.validate("7523169263");
    expect(r.valid).toBe(true);
  });

  test("invalid EGN checksum", () => {
    const r = bg.egn.validate("7523169264");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = bg.egn.validate("752316926");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(bg.egn.country).toBe("BG");
    expect(bg.egn.entityType).toBe("person");
  });
});

// ─── PNF (Foreigner Number) ──────────────────

describe("bg.pnf", () => {
  test("valid PNF", () => {
    const r = bg.pnf.validate("7111042925");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = bg.pnf.validate("7111042926");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = bg.pnf.validate("711104292");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit", () => {
    const r = bg.pnf.validate("711104292A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("compact strips separators", () => {
    expect(bg.pnf.compact("7111 042 925")).toBe(
      "7111042925",
    );
  });

  test("metadata", () => {
    expect(bg.pnf.country).toBe("BG");
    expect(bg.pnf.entityType).toBe("person");
  });
});
