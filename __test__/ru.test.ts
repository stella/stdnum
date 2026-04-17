import { describe, expect, test } from "bun:test";

import { ru } from "../src";

describe("ru.inn", () => {
  test("valid 10-digit INN (company)", () => {
    const r = ru.inn.validate("7707083893");
    expect(r.valid).toBe(true);
  });

  test("valid 12-digit INN (individual)", () => {
    const r = ru.inn.validate("526317984689");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = ru.inn.validate("7707 083 893");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum 10-digit", () => {
    const r = ru.inn.validate("7707083894");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid checksum 12-digit", () => {
    const r = ru.inn.validate("526317984680");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = ru.inn.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = ru.inn.validate("770708389A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("metadata", () => {
    expect(ru.inn.country).toBe("RU");
    expect(ru.inn.entityType).toBe("any");
  });
});
