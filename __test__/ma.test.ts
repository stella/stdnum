import { describe, expect, test } from "bun:test";

import { ma } from "../src";

describe("ma.ice", () => {
  test("valid ICE", () => {
    const r = ma.ice.validate("001561191000066");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("001561191000066");
    }
  });

  test("valid with spaces", () => {
    const r = ma.ice.validate("00 21 36 09 30 00 040");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("002136093000040");
    }
  });

  test("invalid: too short", () => {
    const r = ma.ice.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: contains letters", () => {
    const r = ma.ice.validate("00156119100006A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid checksum", () => {
    const r = ma.ice.validate("001561191000065");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("format returns compact", () => {
    expect(ma.ice.format("001561191000066")).toBe(
      "001561191000066",
    );
  });

  test("metadata", () => {
    expect(ma.ice.abbreviation).toBe("ICE");
    expect(ma.ice.country).toBe("MA");
    expect(ma.ice.entityType).toBe("company");
  });
});
