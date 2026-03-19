import { describe, expect, test } from "bun:test";

import { us } from "../src";

// ─── SSN ────────────────────────────────────

describe("us.ssn", () => {
  test("valid SSN", () => {
    const r = us.ssn.validate("536-90-4399");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("536904399");
  });

  test("valid SSN without separators", () => {
    const r = us.ssn.validate("536904399");
    expect(r.valid).toBe(true);
  });

  test("area 000 is invalid", () => {
    const r = us.ssn.validate("000-12-3456");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("area 666 is invalid", () => {
    const r = us.ssn.validate("666-12-3456");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("area 9xx is invalid", () => {
    const r = us.ssn.validate("900-12-3456");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("group 00 is invalid", () => {
    const r = us.ssn.validate("123-00-4567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("serial 0000 is invalid", () => {
    const r = us.ssn.validate("123-45-0000");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("blacklisted SSN", () => {
    const r = us.ssn.validate("078-05-1120");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = us.ssn.validate("12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = us.ssn.validate("12345678A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format adds separators", () => {
    expect(us.ssn.format("536904399")).toBe("536-90-4399");
  });

  test("metadata", () => {
    expect(us.ssn.country).toBe("US");
    expect(us.ssn.entityType).toBe("person");
  });
});

// ─── EIN ────────────────────────────────────

describe("us.ein", () => {
  test("valid EIN", () => {
    const r = us.ein.validate("04-2103594");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("042103594");
  });

  test("valid EIN without separator", () => {
    const r = us.ein.validate("042103594");
    expect(r.valid).toBe(true);
  });

  test("invalid prefix", () => {
    const r = us.ein.validate("07-1144442");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = us.ein.validate("12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = us.ein.validate("04-210359A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format adds separator", () => {
    expect(us.ein.format("042103594")).toBe("04-2103594");
  });

  test("metadata", () => {
    expect(us.ein.country).toBe("US");
    expect(us.ein.entityType).toBe("company");
  });
});
