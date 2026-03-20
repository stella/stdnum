import { describe, expect, test } from "bun:test";

import { au } from "../src";

// ─── ABN ────────────────────────────────────

describe("au.abn", () => {
  test("valid ABN", () => {
    const r = au.abn.validate("83 914 571 673");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("83914571673");
  });

  test("valid ABN without spaces", () => {
    const r = au.abn.validate("51824753556");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = au.abn.validate("99 999 999 999");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = au.abn.validate("1234567890");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit", () => {
    const r = au.abn.validate("8391457167A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format adds spaces", () => {
    expect(au.abn.format("51824753556")).toBe(
      "51 824 753 556",
    );
  });

  test("metadata", () => {
    expect(au.abn.country).toBe("AU");
    expect(au.abn.entityType).toBe("company");
  });
});

// ─── TFN ────────────────────────────────────

describe("au.tfn", () => {
  test("valid TFN (9 digits)", () => {
    const r = au.tfn.validate("123 456 782");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("123456782");
  });

  test("valid TFN (8 digits)", () => {
    const r = au.tfn.validate("87 650 006");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("87650006");
  });

  test("valid TFN without spaces", () => {
    const r = au.tfn.validate("123456782");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = au.tfn.validate("999 999 999");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = au.tfn.validate("1234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit", () => {
    const r = au.tfn.validate("12345678A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format adds spaces", () => {
    expect(au.tfn.format("123456782")).toBe("123 456 782");
  });

  test("metadata", () => {
    expect(au.tfn.country).toBe("AU");
    expect(au.tfn.entityType).toBe("person");
  });
});

// ─── ACN ────────────────────────────────────

describe("au.acn", () => {
  test("valid ACN", () => {
    const r = au.acn.validate("004 085 616");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("004085616");
  });

  test("valid ACN (second example)", () => {
    const r = au.acn.validate("010 499 966");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = au.acn.validate("999 999 999");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = au.acn.validate("12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit", () => {
    const r = au.acn.validate("00408561A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format adds spaces", () => {
    expect(au.acn.format("004085616")).toBe("004 085 616");
  });

  test("metadata", () => {
    expect(au.acn.country).toBe("AU");
    expect(au.acn.entityType).toBe("company");
  });
});
