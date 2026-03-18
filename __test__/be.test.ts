import { describe, expect, test } from "bun:test";

import { be } from "../src";

describe("be.vat", () => {
  test("valid Belgian VAT", () => {
    const r = be.vat.validate("BE0776091951");
    expect(r.valid).toBe(true);
  });

  test("valid without prefix", () => {
    const r = be.vat.validate("0776091951");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = be.vat.validate("BE0776091952");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid start digit", () => {
    const r = be.vat.validate("BE2776091951");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = be.vat.validate("BE077609195");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds prefix", () => {
    expect(be.vat.format("0776091951")).toBe(
      "BE0776091951",
    );
  });

  test("metadata", () => {
    expect(be.vat.country).toBe("BE");
    expect(be.vat.entityType).toBe("company");
  });
});
