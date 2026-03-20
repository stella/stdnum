import { describe, expect, test } from "bun:test";

import { in_ } from "../src";

// ─── Aadhaar (Unique Identity Number) ────────

describe("in.aadhaar", () => {
  test("valid Aadhaar", () => {
    const r = in_.aadhaar.validate("234123412346");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = in_.aadhaar.validate("2341 2341 2346");
    expect(r.valid).toBe(true);
  });

  test("valid with dashes", () => {
    const r = in_.aadhaar.validate("2341-2341-2346");
    expect(r.valid).toBe(true);
  });

  test("starts with 0", () => {
    const r = in_.aadhaar.validate("012345678901");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("starts with 1", () => {
    const r = in_.aadhaar.validate("112345678901");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid checksum", () => {
    const r = in_.aadhaar.validate("234123412345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = in_.aadhaar.validate("23412341234");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = in_.aadhaar.validate("23412341234A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format groups into 4-4-4", () => {
    expect(in_.aadhaar.format("234123412346")).toBe(
      "2341 2341 2346",
    );
  });

  test("compact strips separators", () => {
    expect(in_.aadhaar.compact("2341 2341 2346")).toBe(
      "234123412346",
    );
  });

  test("metadata", () => {
    expect(in_.aadhaar.abbreviation).toBe("Aadhaar");
    expect(in_.aadhaar.country).toBe("IN");
    expect(in_.aadhaar.entityType).toBe("person");
  });
});

// ─── PAN (Permanent Account Number) ─────────

describe("in.pan", () => {
  test("valid PAN (person)", () => {
    const r = in_.pan.validate("ABCPP1234C");
    expect(r.valid).toBe(true);
  });

  test("valid PAN (company)", () => {
    const r = in_.pan.validate("AAACR5055K");
    expect(r.valid).toBe(true);
  });

  test("valid lowercase (normalized)", () => {
    const r = in_.pan.validate("abcpp1234c");
    expect(r.valid).toBe(true);
  });

  test("invalid holder type (4th char)", () => {
    const r = in_.pan.validate("ABCXP1234C");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid format (digits where letters expected)", () => {
    const r = in_.pan.validate("12345ABCDE");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("wrong length", () => {
    const r = in_.pan.validate("ABCPP1234");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("compact strips and uppercases", () => {
    expect(in_.pan.compact("abcpp 1234 c")).toBe(
      "ABCPP1234C",
    );
  });

  test("format returns compact form", () => {
    expect(in_.pan.format("abcpp1234c")).toBe(
      "ABCPP1234C",
    );
  });

  test("metadata", () => {
    expect(in_.pan.abbreviation).toBe("PAN");
    expect(in_.pan.country).toBe("IN");
    expect(in_.pan.entityType).toBe("any");
  });
});

// ─── GSTIN (GST Identification Number) ──────

describe("in.gstin", () => {
  test("valid GSTIN", () => {
    const r = in_.gstin.validate("27AAPFU0939F1ZV");
    expect(r.valid).toBe(true);
  });

  test("valid GSTIN (another example)", () => {
    const r = in_.gstin.validate("29AAGCB7383J1Z4");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = in_.gstin.validate("27 AAPFU0939F1ZV");
    expect(r.valid).toBe(true);
  });

  test("invalid state code (00)", () => {
    const r = in_.gstin.validate("00AAPFU0939F1ZV");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid state code (99)", () => {
    const r = in_.gstin.validate("99AAPFU0939F1ZV");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid checksum", () => {
    const r = in_.gstin.validate("27AAPFU0939F1ZA");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = in_.gstin.validate("27AAPFU0939F1Z");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid format", () => {
    const r = in_.gstin.validate("27AAPFU0939F1AA");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("compact strips and uppercases", () => {
    expect(in_.gstin.compact("27 aapfu0939f1zv")).toBe(
      "27AAPFU0939F1ZV",
    );
  });

  test("metadata", () => {
    expect(in_.gstin.abbreviation).toBe("GSTIN");
    expect(in_.gstin.country).toBe("IN");
    expect(in_.gstin.entityType).toBe("company");
  });
});
