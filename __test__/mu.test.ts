import { describe, expect, test } from "bun:test";

import { mu } from "../src";

describe("mu.brn", () => {
  test("valid entity BRN (C prefix)", () => {
    const r = mu.brn.validate("C07015330");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("C07015330");
    }
  });

  test("valid entity BRN (F prefix)", () => {
    const r = mu.brn.validate("F07000605");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("F07000605");
    }
  });

  test("valid entity BRN (various years)", () => {
    for (const v of [
      "C16135302",
      "C18154956",
      "C10094955",
      "C13115318",
      "C21170119",
    ]) {
      const r = mu.brn.validate(v);
      expect(r.valid).toBe(true);
    }
  });

  test("valid individual BRN (8 digits)", () => {
    const r = mu.brn.validate("02501554");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("02501554");
    }
  });

  test("valid with lowercase", () => {
    const r = mu.brn.validate("c07015330");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("C07015330");
    }
  });

  test("valid with spaces and dashes", () => {
    const r = mu.brn.validate("C07 015-330");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("C07015330");
    }
  });

  test("invalid: wrong length (too short)", () => {
    const r = mu.brn.validate("C07015");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: wrong length (too long)", () => {
    const r = mu.brn.validate("C070153301");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: letters in digit positions", () => {
    const r = mu.brn.validate("C0701533A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid: individual BRN starting with 4+", () => {
    const r = mu.brn.validate("42501554");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format returns compact uppercase", () => {
    expect(mu.brn.format("c07015330")).toBe(
      "C07015330",
    );
  });

  test("metadata", () => {
    expect(mu.brn.abbreviation).toBe("BRN");
    expect(mu.brn.country).toBe("MU");
    expect(mu.brn.entityType).toBe("any");
  });
});
