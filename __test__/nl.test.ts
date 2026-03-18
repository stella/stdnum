import { describe, expect, test } from "bun:test";

import { nl } from "../src";

describe("nl.vat", () => {
  test("valid Dutch VAT", () => {
    const r = nl.vat.validate("NL123456789B13");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = nl.vat.validate("NL123456789B14");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("missing B", () => {
    const r = nl.vat.validate("NL123456789A13");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = nl.vat.validate("NL12345678B0");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(nl.vat.country).toBe("NL");
  });
});
