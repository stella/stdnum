import { describe, expect, test } from "bun:test";

import { iq } from "../src";

describe("iq.nid", () => {
  test("valid NID", () => {
    const r = iq.nid.validate("012345678901");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("012345678901");
    }
  });

  test("valid with separators", () => {
    const r = iq.nid.validate("012-345-678-901");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("012345678901");
    }
  });

  test("valid with spaces", () => {
    const r = iq.nid.validate("012 345 678 901");
    expect(r.valid).toBe(true);
  });

  test("valid with Arabic-Indic digits", () => {
    // ٠١٢٣٤٥٦٧٨٩٠١
    const r = iq.nid.validate("٠١٢٣٤٥٦٧٨٩٠١");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("012345678901");
    }
  });

  test("valid with Persian digits", () => {
    // ۰۱۲۳۴۵۶۷۸۹۰۱
    const r = iq.nid.validate("۰۱۲۳۴۵۶۷۸۹۰۱");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("012345678901");
    }
  });

  test("invalid: too short", () => {
    const r = iq.nid.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: too long", () => {
    const r = iq.nid.validate("0123456789012");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: contains letters", () => {
    const r = iq.nid.validate("01234567890A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format returns compact", () => {
    expect(iq.nid.format("012-345-678-901")).toBe(
      "012345678901",
    );
  });

  test("metadata", () => {
    expect(iq.nid.abbreviation).toBe("NID");
    expect(iq.nid.country).toBe("IQ");
    expect(iq.nid.entityType).toBe("person");
  });
});
