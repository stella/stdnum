import { describe, expect, test } from "bun:test";

import { mc } from "../src";

describe("mc.tva", () => {
  test("valid Monacan TVA", () => {
    const r = mc.tva.validate("53 0000 04605");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("FR53000004605");
    }
  });

  test("valid with FR prefix", () => {
    const r = mc.tva.validate("FR53000004605");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("FR53000004605");
    }
  });

  test("French number rejected (not Monaco)", () => {
    const r = mc.tva.validate("FR 61 954 506 077");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = mc.tva.validate("5300000460");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("compact adds FR prefix", () => {
    expect(mc.tva.compact("53 0000 04605")).toBe(
      "FR53000004605",
    );
  });

  test("metadata", () => {
    expect(mc.tva.country).toBe("MC");
    expect(mc.tva.abbreviation).toBe("TVA");
    expect(mc.tva.entityType).toBe("company");
  });
});
