import { describe, expect, test } from "bun:test";

import { at } from "../src";

describe("at.uid", () => {
  test("valid UID", () => {
    const r = at.uid.validate("ATU13585627");
    expect(r.valid).toBe(true);
  });

  test("valid without prefix", () => {
    const r = at.uid.validate("U13585627");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = at.uid.validate("U13585626");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = at.uid.validate("U1358562");
    expect(r.valid).toBe(false);
  });

  test("must start with U", () => {
    const r = at.uid.validate("X13585627");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("format adds AT prefix", () => {
    expect(at.uid.format("U13585627")).toBe("ATU13585627");
  });

  test("metadata", () => {
    expect(at.uid.abbreviation).toBe("UID");
    expect(at.uid.country).toBe("AT");
    expect(at.uid.entityType).toBe("company");
  });
});
