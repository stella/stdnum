import { describe, expect, test } from "bun:test";
import { me } from "../src";
describe("me.pib", () => {
  test("valid PIB", () => { const r = me.pib.validate("02655284"); expect(r.valid).toBe(true); });
  test("valid with spaces", () => { const r = me.pib.validate("02 655 284"); expect(r.valid).toBe(true); });
  test("valid: 02000989", () => { const r = me.pib.validate("02000989"); expect(r.valid).toBe(true); });
  test("valid: 02005115", () => { const r = me.pib.validate("02005115"); expect(r.valid).toBe(true); });
  test("invalid checksum", () => { const r = me.pib.validate("02655283"); expect(r.valid).toBe(false); if (!r.valid) expect(r.error.code).toBe("INVALID_CHECKSUM"); });
  test("wrong length", () => { const r = me.pib.validate("12345"); expect(r.valid).toBe(false); if (!r.valid) expect(r.error.code).toBe("INVALID_LENGTH"); });
  test("non-digit characters", () => { const r = me.pib.validate("1234567A"); expect(r.valid).toBe(false); if (!r.valid) expect(r.error.code).toBe("INVALID_FORMAT"); });
  test("metadata", () => { expect(me.pib.country).toBe("ME"); expect(me.pib.entityType).toBe("any"); });
});
