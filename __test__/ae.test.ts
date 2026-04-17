import { describe, expect, test } from "bun:test";

import { ae } from "../src";

// ─── EID (Emirates ID) ───────────────────────────

describe("ae.eid", () => {
  test("valid compact", () => {
    const r = ae.eid.validate("784198012345678");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("784198012345678");
    }
  });

  test("valid with hyphens", () => {
    const r = ae.eid.validate("784-1980-1234567-8");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("784198012345678");
    }
  });

  test("valid with spaces", () => {
    const r = ae.eid.validate("784 1980 1234567 8");
    expect(r.valid).toBe(true);
  });

  test("valid: identique test vectors", () => {
    for (const id of [
      "784-1979-1234567-1",
      "784-1952-0464048-6",
      "784-1968-6570305-0",
    ]) {
      const r = ae.eid.validate(id);
      expect(r.valid).toBe(true);
    }
  });

  test("invalid checksum", () => {
    const r = ae.eid.validate("784-1981-1234567-9");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid: does not start with 784", () => {
    const r = ae.eid.validate("785198012345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid: too short", () => {
    const r = ae.eid.validate("78419801234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: too long", () => {
    const r = ae.eid.validate("7841980123456789");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: contains letters", () => {
    const r = ae.eid.validate("784198A12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format adds hyphens", () => {
    expect(ae.eid.format("784198012345678")).toBe(
      "784-1980-1234567-8",
    );
  });

  test("compact strips separators", () => {
    expect(ae.eid.compact("784-1980-1234567-8")).toBe(
      "784198012345678",
    );
  });

  test("generate produces valid IDs", () => {
    for (let i = 0; i < 20; i++) {
      const id = ae.eid.generate!();
      const r = ae.eid.validate(id);
      expect(r.valid).toBe(true);
    }
  });

  test("metadata", () => {
    expect(ae.eid.abbreviation).toBe("EID");
    expect(ae.eid.country).toBe("AE");
    expect(ae.eid.entityType).toBe("person");
  });
});
