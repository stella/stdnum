import { describe, expect, test } from "bun:test";

import { cy } from "../src";

describe("cy.vat", () => {
  test("valid Cypriot VAT", () => {
    const r = cy.vat.validate("CY10259033P");
    expect(r.valid).toBe(true);
  });

  test("invalid check letter", () => {
    const r = cy.vat.validate("CY10259033Q");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("cannot start with 12", () => {
    const r = cy.vat.validate("CY12000000A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = cy.vat.validate("CY1234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(cy.vat.country).toBe("CY");
  });
});
