import { describe, expect, test } from "bun:test";
import { ba } from "../src";
import { parse } from "../src/ba/jmbg";
describe("ba.jmbg", () => {
  test("valid JMBG", () => { const r = ba.jmbg.validate("0101006500006"); expect(r.valid).toBe(true); });
  test("valid with spaces", () => { const r = ba.jmbg.validate("0101006 500006"); expect(r.valid).toBe(true); });
  test("invalid checksum", () => { const r = ba.jmbg.validate("0101006500007"); expect(r.valid).toBe(false); if (!r.valid) expect(r.error.code).toBe("INVALID_CHECKSUM"); });
  test("invalid date", () => { const r = ba.jmbg.validate("3213006500001"); expect(r.valid).toBe(false); if (!r.valid) expect(r.error.code).toBe("INVALID_COMPONENT"); });
  test("wrong length", () => { const r = ba.jmbg.validate("010100650000"); expect(r.valid).toBe(false); if (!r.valid) expect(r.error.code).toBe("INVALID_LENGTH"); });
  test("non-digit characters", () => { const r = ba.jmbg.validate("010100650000A"); expect(r.valid).toBe(false); if (!r.valid) expect(r.error.code).toBe("INVALID_FORMAT"); });
  test("metadata", () => { expect(ba.jmbg.country).toBe("BA"); expect(ba.jmbg.entityType).toBe("person"); });
  test("parse: birth date and gender", () => { const result = parse("0101006500006"); expect(result).not.toBeNull(); expect(result!.birthDate.getFullYear()).toBe(2006); expect(result!.birthDate.getMonth()).toBe(0); expect(result!.birthDate.getDate()).toBe(1); expect(result!.gender).toBe("male"); });
  test("parse: returns null for invalid", () => { const result = parse("0101006500007"); expect(result).toBeNull(); });
});
