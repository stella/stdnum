import { describe, expect, test } from "bun:test";

import { li } from "../src";

describe("li.peid", () => {
  test("valid PEID", () => {
    const r = li.peid.validate("1234567");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("1234567");
    }
  });

  test("valid with leading zeros", () => {
    const r = li.peid.validate("00001234567");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("1234567");
    }
  });

  test("valid 4-digit", () => {
    const r = li.peid.validate("1234");
    expect(r.valid).toBe(true);
  });

  test("valid 12-digit", () => {
    const r = li.peid.validate("123456789012");
    expect(r.valid).toBe(true);
  });

  test("too short", () => {
    const r = li.peid.validate("123");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("too long", () => {
    const r = li.peid.validate("1234567890123");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = li.peid.validate("12345AB");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("metadata", () => {
    expect(li.peid.country).toBe("LI");
    expect(li.peid.abbreviation).toBe("PEID");
    expect(li.peid.entityType).toBe("any");
  });
});
