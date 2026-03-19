import { describe, expect, test } from "bun:test";

import { tr } from "../src";

// ─── T.C. Kimlik ─────────────────────────────

describe("tr.tckimlik", () => {
  test("valid T.C. Kimlik", () => {
    const r = tr.tckimlik.validate("17291716060");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = tr.tckimlik.validate("172 9171 6060");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum (10th digit)", () => {
    const r = tr.tckimlik.validate("17291716050");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = tr.tckimlik.validate("1729171606");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("starts with 0", () => {
    const r = tr.tckimlik.validate("07291716092");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("non-digit characters", () => {
    const r = tr.tckimlik.validate("1729171606A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("compact strips separators", () => {
    expect(tr.tckimlik.compact("172-917-160-60")).toBe(
      "17291716060",
    );
  });

  test("metadata", () => {
    expect(tr.tckimlik.abbreviation).toBe("T.C. Kimlik");
    expect(tr.tckimlik.country).toBe("TR");
    expect(tr.tckimlik.entityType).toBe("person");
  });
});

// ─── VKN ──────────────────────────────────────

describe("tr.vkn", () => {
  test("valid VKN", () => {
    const r = tr.vkn.validate("4540536920");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = tr.vkn.validate("454 053 6920");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = tr.vkn.validate("4540536921");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = tr.vkn.validate("454053692");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = tr.vkn.validate("45405369AB");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("compact strips separators", () => {
    expect(tr.vkn.compact("454-053-6920")).toBe(
      "4540536920",
    );
  });

  test("metadata", () => {
    expect(tr.vkn.abbreviation).toBe("VKN");
    expect(tr.vkn.country).toBe("TR");
    expect(tr.vkn.entityType).toBe("company");
  });
});
