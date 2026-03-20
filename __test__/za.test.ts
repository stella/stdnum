import { describe, expect, test } from "bun:test";

import { za } from "../src";
import { parse } from "../src/za/idnr";

describe("za.idnr", () => {
  test("valid SA ID", () => {
    const r = za.idnr.validate("7503305044089");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("7503305044089");
  });

  test("valid SA ID with spaces", () => {
    const r = za.idnr.validate("750330 5044089");
    expect(r.valid).toBe(true);
  });

  test("valid SA ID (citizen)", () => {
    const r = za.idnr.validate("8001015009087");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = za.idnr.validate("8503305044089");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = za.idnr.validate("9125568");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid date", () => {
    const r = za.idnr.validate("7513305044084");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid citizenship digit", () => {
    const r = za.idnr.validate("7503305044289");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("non-digit", () => {
    const r = za.idnr.validate("750330504408A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format adds separators", () => {
    expect(za.idnr.format("7503305044089")).toBe(
      "750330 5044 08 9",
    );
  });

  test("metadata", () => {
    expect(za.idnr.country).toBe("ZA");
    expect(za.idnr.entityType).toBe("person");
  });
});

// ─── parse() ────────────────────────────────

describe("za.idnr parse", () => {
  test("parse male citizen", () => {
    const p = parse("7503305044089");
    expect(p).not.toBeNull();
    if (p) {
      expect(p.gender).toBe("male");
      expect(p.birthDate.getFullYear()).toBe(1975);
      expect(p.birthDate.getMonth()).toBe(2); // March
      expect(p.birthDate.getDate()).toBe(30);
    }
  });

  test("parse male citizen (2)", () => {
    const p = parse("8001015009087");
    expect(p).not.toBeNull();
    if (p) {
      expect(p.gender).toBe("male");
      expect(p.birthDate.getFullYear()).toBe(1980);
      expect(p.birthDate.getMonth()).toBe(0); // January
      expect(p.birthDate.getDate()).toBe(1);
    }
  });

  test("parse returns null for invalid", () => {
    expect(parse("8503305044089")).toBeNull();
  });
});
