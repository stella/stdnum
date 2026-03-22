import { describe, expect, test } from "bun:test";

import { de } from "../src";

// --- USt-IdNr. -----------------------------------------

describe("de.vat", () => {
  test("valid German VAT", () => {
    const r = de.vat.validate("DE136695976");
    expect(r.valid).toBe(true);
  });

  test("valid without prefix", () => {
    const r = de.vat.validate("136695976");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = de.vat.validate("DE136695978");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = de.vat.validate("DE12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds DE prefix", () => {
    expect(de.vat.format("136695976")).toBe("DE136695976");
  });

  test("metadata", () => {
    expect(de.vat.abbreviation).toBe("USt-IdNr.");
    expect(de.vat.country).toBe("DE");
    expect(de.vat.entityType).toBe("company");
  });
});

// --- IdNr ----------------------------------------------

describe("de.idnr", () => {
  test("valid German IdNr", () => {
    const r = de.idnr.validate("36574261809");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = de.idnr.validate("36 574 261 809");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = de.idnr.validate("36574261808");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = de.idnr.validate("1234567890");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format spaces", () => {
    expect(de.idnr.format("36574261809")).toBe(
      "36 574 261 809",
    );
  });

  test("metadata", () => {
    expect(de.idnr.abbreviation).toBe("IdNr");
    expect(de.idnr.country).toBe("DE");
    expect(de.idnr.entityType).toBe("person");
  });
});

// --- StNr ----------------------------------------------

describe("de.stnr", () => {
  test("valid 10-digit regional (Baden-Württemberg)", () => {
    const r = de.stnr.validate("2181508150");
    expect(r.valid).toBe(true);
  });

  test("valid 11-digit regional (Bayern)", () => {
    const r = de.stnr.validate("18181508155");
    expect(r.valid).toBe(true);
  });

  test("valid 13-digit federal", () => {
    const r = de.stnr.validate("2475081508152");
    expect(r.valid).toBe(true);
  });

  test("valid with separators", () => {
    const r = de.stnr.validate("21/815/08150");
    expect(r.valid).toBe(true);
  });

  test("valid NRW regional (11 digits)", () => {
    const r = de.stnr.validate("13381508159");
    expect(r.valid).toBe(true);
  });

  test("wrong length (9 digits)", () => {
    const r = de.stnr.validate("123456789");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit characters", () => {
    const r = de.stnr.validate("21815A8150");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("no matching state pattern (13-digit)", () => {
    // 13 digits; no state starts with 6
    const r = de.stnr.validate("6123081508152");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("format adds slashes", () => {
    const formatted = de.stnr.format("2181508150");
    expect(formatted).toContain("/");
  });

  test("metadata", () => {
    expect(de.stnr.abbreviation).toBe("StNr");
    expect(de.stnr.country).toBe("DE");
    expect(de.stnr.entityType).toBe("any");
  });
});

// --- SVNR ----------------------------------------------

describe("de.svnr", () => {
  test("valid SVNR", () => {
    const r = de.svnr.validate("12010188M011");
    expect(r.valid).toBe(true);
  });

  test("valid with spaces", () => {
    const r = de.svnr.validate("12 010188 M 01 1");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = de.svnr.validate("12010188M012");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = de.svnr.validate("12010188M0");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid format (no letter)", () => {
    const r = de.svnr.validate("120101880011");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid birth date", () => {
    const r = de.svnr.validate("12320188M011");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("format adds spaces", () => {
    expect(de.svnr.format("12010188M011")).toBe(
      "12 010188 M 01 1",
    );
  });

  test("metadata", () => {
    expect(de.svnr.abbreviation).toBe("SVNR");
    expect(de.svnr.country).toBe("DE");
    expect(de.svnr.entityType).toBe("person");
  });
});

// --- Handelsregisternummer --------------------------

describe("de.handelsreg", () => {
  test("valid HRB number", () => {
    const r = de.handelsreg.validate("HRB 12345");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("HRB 12345");
  });

  test("valid HRA number", () => {
    const r = de.handelsreg.validate("HRA 54321");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("HRA 54321");
  });

  test("valid without space", () => {
    const r = de.handelsreg.validate("HRB12345");
    expect(r.valid).toBe(true);
    if (r.valid) expect(r.compact).toBe("HRB 12345");
  });

  test("valid lowercase", () => {
    const r = de.handelsreg.validate("hrb 12345");
    expect(r.valid).toBe(true);
  });

  test("valid GnR register", () => {
    const r = de.handelsreg.validate("GnR 789");
    expect(r.valid).toBe(true);
  });

  test("valid VR register", () => {
    const r = de.handelsreg.validate("VR 1234");
    expect(r.valid).toBe(true);
  });

  test("valid PR register", () => {
    const r = de.handelsreg.validate("PR 567");
    expect(r.valid).toBe(true);
  });

  test("invalid: no register type", () => {
    const r = de.handelsreg.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("invalid: unknown register type", () => {
    const r = de.handelsreg.validate("HRC 12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("number too long (8 digits)", () => {
    const r = de.handelsreg.validate("HRB 12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format normalizes", () => {
    expect(de.handelsreg.format("hrb12345")).toBe(
      "HRB 12345",
    );
  });

  test("compact matches format for valid input", () => {
    expect(de.handelsreg.compact("hrb 12345")).toBe(
      "HRB 12345",
    );
  });

  test("metadata", () => {
    expect(de.handelsreg.country).toBe("DE");
    expect(de.handelsreg.entityType).toBe("company");
  });

  test("examples are all valid", () => {
    for (const ex of de.handelsreg.examples ?? []) {
      const r = de.handelsreg.validate(ex);
      expect(r.valid).toBe(true);
    }
  });
});
