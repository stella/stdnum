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

// ─── ITIN ───────────────────────────────────

describe("us.itin", () => {
  test("valid ITIN with dashes", () => {
    const r = us.itin.validate("912-90-3456");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("912903456");
  });

  test("valid ITIN without separators", () => {
    const r = us.itin.validate("912903456");
    expect(r.valid).toBe(true);
  });

  test("area not starting with 9 is invalid", () => {
    const r = us.itin.validate("812-70-3456");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("disallowed group 89", () => {
    const r = us.itin.validate("912-89-3456");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("disallowed group 93", () => {
    const r = us.itin.validate("912-93-3456");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("group outside 70-99 range", () => {
    const r = us.itin.validate("912-50-3456");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = us.itin.validate("91290345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = us.itin.validate("91290345A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("misplaced hyphen is rejected", () => {
    const r = us.itin.validate("912-903456");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("912903456");
  });

  test("format adds dashes", () => {
    expect(us.itin.format("912903456")).toBe("912-90-3456");
  });

  test("metadata", () => {
    expect(us.itin.abbreviation).toBe("ITIN");
    expect(us.itin.country).toBe("US");
    expect(us.itin.entityType).toBe("person");
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

// ─── RTN ────────────────────────────────────

describe("us.rtn", () => {
  test("valid RTN (Federal Reserve Bank of NY)", () => {
    const r = us.rtn.validate("021000021");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("021000021");
  });

  test("valid RTN (Chase)", () => {
    const r = us.rtn.validate("111000025");
    expect(r.valid).toBe(true);
  });

  test("valid with dashes", () => {
    const r = us.rtn.validate("021-000-021");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = us.rtn.validate("021 000 021");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = us.rtn.validate("021000022");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = us.rtn.validate("02100002");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = us.rtn.validate("02100002A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid prefix (00)", () => {
    const r = us.rtn.validate("001000021");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid prefix (13)", () => {
    const r = us.rtn.validate("131000021");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("valid thrift prefix (21)", () => {
    const r = us.rtn.validate("210000023");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("210000023");
  });

  test("metadata", () => {
    expect(us.rtn.abbreviation).toBe("RTN");
    expect(us.rtn.country).toBe("US");
    expect(us.rtn.entityType).toBe("company");
  });

  test("examples are all valid", () => {
    for (const ex of us.rtn.examples ?? []) {
      const r = us.rtn.validate(ex);
      expect(r.valid).toBe(true);
    }
  });
});
