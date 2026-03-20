import { describe, expect, test } from "bun:test";

import { ua } from "../src";

describe("ua.edrpou", () => {
  test("valid EDRPOU", () => {
    const r = ua.edrpou.validate("14360570");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = ua.edrpou.validate("14 360 570");
    expect(r.valid).toBe(true);
  });

  test("valid EDRPOU (high first digit)", () => {
    const r = ua.edrpou.validate("32855961");
    expect(r.valid).toBe(true);
  });

  test("valid EDRPOU (first digit >= 6)", () => {
    // Non-uniform digits: valid only under WEIGHTS_A,
    // would fail under WEIGHTS_B (check=9, not 6).
    const r = ua.edrpou.validate("60000006");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = ua.edrpou.validate("14360571");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = ua.edrpou.validate("1436057");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = ua.edrpou.validate("1436057A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("metadata", () => {
    expect(ua.edrpou.country).toBe("UA");
    expect(ua.edrpou.entityType).toBe("company");
  });
});
