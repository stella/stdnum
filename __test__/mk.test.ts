import { describe, expect, test } from "bun:test";
import { mk } from "../src";
describe("mk.edb", () => {
  test("valid EDB", () => { const r = mk.edb.validate("4002012527974"); expect(r.valid).toBe(true); });
  test("valid with MK prefix", () => { const r = mk.edb.validate("MK4030005534810"); expect(r.valid).toBe(true); });
  test("valid with MK prefix and space", () => { const r = mk.edb.validate("MK 4030005534810"); expect(r.valid).toBe(true); });
  test("valid with Cyrillic prefix", () => { const r = mk.edb.validate("МК4011014511586"); expect(r.valid).toBe(true); });
  test("valid: 4030996123112", () => { const r = mk.edb.validate("4030996123112"); expect(r.valid).toBe(true); });
  test("invalid checksum", () => { const r = mk.edb.validate("4030000375890"); expect(r.valid).toBe(false); if (!r.valid) expect(r.error.code).toBe("INVALID_CHECKSUM"); });
  test("wrong length", () => { const r = mk.edb.validate("12345"); expect(r.valid).toBe(false); if (!r.valid) expect(r.error.code).toBe("INVALID_LENGTH"); });
  test("non-digit characters", () => { const r = mk.edb.validate("1234567890XYZ"); expect(r.valid).toBe(false); if (!r.valid) expect(r.error.code).toBe("INVALID_FORMAT"); });
  test("metadata", () => { expect(mk.edb.country).toBe("MK"); expect(mk.edb.entityType).toBe("any"); });
});
