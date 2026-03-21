import { describe, expect, test } from "bun:test";

import { kz } from "../src";
import { parse } from "../src/kz/iin";

describe("kz.iin", () => {
  test("valid IIN (male, 1988)", () => {
    const r = kz.iin.validate("880515300120");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("880515300120");
  });

  test("valid IIN (female, 1995)", () => {
    const r = kz.iin.validate("950101400012");
    expect(r.valid).toBe(true);
  });

  test("valid IIN (male, 2001)", () => {
    const r = kz.iin.validate("010215500231");
    expect(r.valid).toBe(true);
  });

  test("valid IIN with spaces", () => {
    const r = kz.iin.validate("880515 300120");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("880515300120");
  });

  test("wrong length", () => {
    const r = kz.iin.validate("8805153001");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_LENGTH");
  });

  test("non-digit characters", () => {
    const r = kz.iin.validate("88051530012A");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_FORMAT");
  });

  test("invalid century digit (0)", () => {
    const r = kz.iin.validate("880515000120");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_COMPONENT");
  });

  test("invalid century digit (7)", () => {
    const r = kz.iin.validate("880515700120");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_COMPONENT");
  });

  test("invalid birth date (month 13)", () => {
    const r = kz.iin.validate("881301300120");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_COMPONENT");
  });

  test("invalid checksum", () => {
    // Change last digit from 0 to 1
    const r = kz.iin.validate("880515300121");
    expect(r.valid).toBe(false);
    if (!r.valid)
      expect(r.error.code).toBe("INVALID_CHECKSUM");
  });

  test("parse extracts birth date and gender", () => {
    const p = parse("880515300120");
    expect(p).not.toBeNull();
    if (p) {
      expect(p.birthDate.getFullYear()).toBe(1988);
      expect(p.birthDate.getMonth()).toBe(4); // May
      expect(p.birthDate.getDate()).toBe(15);
      expect(p.gender).toBe("male");
    }
  });

  test("parse female 1995", () => {
    const p = parse("950101400012");
    expect(p).not.toBeNull();
    if (p) {
      expect(p.birthDate.getFullYear()).toBe(1995);
      expect(p.gender).toBe("female");
    }
  });

  test("parse returns null for invalid", () => {
    expect(parse("880515300121")).toBeNull();
  });

  test("compact strips spaces", () => {
    expect(kz.iin.compact("880515 300120")).toBe(
      "880515300120",
    );
  });

  test("format adds space after date", () => {
    expect(kz.iin.format("880515300120")).toBe(
      "880515 300120",
    );
  });

  test("metadata", () => {
    expect(kz.iin.abbreviation).toBe("IIN");
    expect(kz.iin.country).toBe("KZ");
    expect(kz.iin.entityType).toBe("person");
  });
});
