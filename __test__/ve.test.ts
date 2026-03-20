import { describe, expect, test } from "bun:test";

import { ve } from "../src";

describe("ve.rif", () => {
  test("valid V (natural person)", () => {
    const r = ve.rif.validate("V309876543");
    expect(r.valid).toBe(true);
  });
  test("valid J (juridical entity)", () => {
    const r = ve.rif.validate("J309876546");
    expect(r.valid).toBe(true);
  });
  test("valid E (foreign person)", () => {
    const r = ve.rif.validate("E309876540");
    expect(r.valid).toBe(true);
  });
  test("valid P (passport holder)", () => {
    const r = ve.rif.validate("P309876542");
    expect(r.valid).toBe(true);
  });
  test("valid G (government entity)", () => {
    const r = ve.rif.validate("G309876549");
    expect(r.valid).toBe(true);
  });
  test("valid with dashes", () => {
    const r = ve.rif.validate("V-30987654-3");
    expect(r.valid).toBe(true);
  });
  test("valid with spaces", () => {
    const r = ve.rif.validate("J 30987654 6");
    expect(r.valid).toBe(true);
  });
  test("invalid checksum", () => {
    const r = ve.rif.validate("J309876540");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_CHECKSUM");
  });
  test("wrong length", () => {
    const r = ve.rif.validate("J30987654");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_LENGTH");
  });
  test("invalid prefix", () => {
    const r = ve.rif.validate("X309876543");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_COMPONENT");
  });
  test("non-digit body", () => {
    const r = ve.rif.validate("J30987654A");
    expect(r.valid).toBe(false);
    if (!r.valid) expect(r.error.code).toBe("INVALID_FORMAT");
  });
  test("compact strips separators", () => {
    expect(ve.rif.compact("V-30987654-3")).toBe("V309876543");
  });
  test("format adds dashes", () => {
    expect(ve.rif.format("V309876543")).toBe("V-30987654-3");
  });
  test("metadata", () => {
    expect(ve.rif.abbreviation).toBe("RIF");
    expect(ve.rif.country).toBe("VE");
    expect(ve.rif.entityType).toBe("any");
  });
});
