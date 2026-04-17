import { describe, expect, test } from "bun:test";

import { ca } from "../src";

// ─── SIN ────────────────────────────────────

describe("ca.sin", () => {
  test("valid SIN", () => {
    const r = ca.sin.validate("123-456-782");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("123456782");
  });

  test("valid SIN without separators", () => {
    const r = ca.sin.validate("123456782");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = ca.sin.validate("999-999-999");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("starts with 0", () => {
    const r = ca.sin.validate("023456782");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("starts with 8", () => {
    const r = ca.sin.validate("823456785");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("non-digit", () => {
    const r = ca.sin.validate("12345678Z");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("wrong length", () => {
    const r = ca.sin.validate("12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds separators", () => {
    expect(ca.sin.format("123456782")).toBe("123-456-782");
  });

  test("metadata", () => {
    expect(ca.sin.country).toBe("CA");
    expect(ca.sin.entityType).toBe("person");
  });
});

// ─── BN ─────────────────────────────────────

describe("ca.bn", () => {
  test("valid BN (9-digit)", () => {
    const r = ca.bn.validate("12302 6635");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("123026635");
  });

  test("valid BN15", () => {
    const r = ca.bn.validate("12302 6635 RC 0001");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("123026635RC0001");
    }
  });

  test("invalid checksum", () => {
    const r = ca.bn.validate("123456783");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid program type", () => {
    const r = ca.bn.validate("123026635XX0001");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("non-digit in root", () => {
    const r = ca.bn.validate("12345678Z");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("wrong length", () => {
    const r = ca.bn.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format BN9", () => {
    expect(ca.bn.format("123026635")).toBe("123 026 635");
  });

  test("format BN15", () => {
    expect(ca.bn.format("123026635RC0001")).toBe(
      "123 026 635 RC 0001",
    );
  });

  test("metadata", () => {
    expect(ca.bn.country).toBe("CA");
    expect(ca.bn.entityType).toBe("company");
  });
});
