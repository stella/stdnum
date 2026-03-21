import { describe, expect, test } from "bun:test";

import { ge } from "../src";

describe("ge.pin", () => {
  test("valid 9-digit PIN", () => {
    const r = ge.pin.validate("010043120");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("010043120");
  });

  test("valid 11-digit PIN", () => {
    const r = ge.pin.validate("01024030303");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("01024030303");
  });

  test("valid PIN with spaces", () => {
    const r = ge.pin.validate("010 043 120");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("010043120");
  });

  test("wrong length (10 digits)", () => {
    const r = ge.pin.validate("0100431201");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });

  test("wrong length (too short)", () => {
    const r = ge.pin.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });

  test("non-digit characters", () => {
    const r = ge.pin.validate("01004312A");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_FORMAT");
  });

  test("compact strips spaces and dashes", () => {
    expect(ge.pin.compact("010-043-120")).toBe(
      "010043120",
    );
  });

  test("format returns compact form", () => {
    expect(ge.pin.format("010 043 120")).toBe(
      "010043120",
    );
  });

  test("metadata", () => {
    expect(ge.pin.abbreviation).toBe("PIN");
    expect(ge.pin.country).toBe("GE");
    expect(ge.pin.entityType).toBe("any");
  });
});
