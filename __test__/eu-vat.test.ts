import { describe, expect, test } from "bun:test";

import {
  be,
  bg,
  cy,
  dk,
  ee,
  es,
  fi,
  gr,
  hr,
  hu,
  ie,
  lt,
  lu,
  lv,
  mt,
  nl,
  pt,
  ro,
  se,
  si,
} from "../src";

// ─── Belgium ─────────────────────────────────────

describe("be.vat", () => {
  test("valid Belgian VAT", () => {
    const r = be.vat.validate("BE0776091951");
    expect(r.valid).toBe(true);
  });

  test("valid without prefix", () => {
    const r = be.vat.validate("0776091951");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = be.vat.validate("BE0776091952");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid start digit", () => {
    const r = be.vat.validate("BE2776091951");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = be.vat.validate("BE077609195");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("format adds prefix", () => {
    expect(be.vat.format("0776091951")).toBe(
      "BE0776091951",
    );
  });

  test("metadata", () => {
    expect(be.vat.country).toBe("BE");
    expect(be.vat.entityType).toBe("company");
  });
});

// ─── Bulgaria ────────────────────────────────────

describe("bg.vat", () => {
  test("valid 9-digit Bulgarian VAT", () => {
    const r = bg.vat.validate("BG175074752");
    expect(r.valid).toBe(true);
  });

  test("valid 10-digit Bulgarian VAT", () => {
    const r = bg.vat.validate("BG7523169263");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum 9-digit", () => {
    const r = bg.vat.validate("BG175074753");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = bg.vat.validate("BG12345678901");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(bg.vat.country).toBe("BG");
  });
});

// ─── Cyprus ──────────────────────────────────────

describe("cy.vat", () => {
  test("valid Cypriot VAT", () => {
    const r = cy.vat.validate("CY10259033P");
    expect(r.valid).toBe(true);
  });

  test("invalid check letter", () => {
    const r = cy.vat.validate("CY10259033Q");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("cannot start with 12", () => {
    const r = cy.vat.validate("CY12000000A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = cy.vat.validate("CY1234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(cy.vat.country).toBe("CY");
  });
});

// ─── Denmark ─────────────────────────────────────

describe("dk.vat", () => {
  test("valid Danish VAT", () => {
    const r = dk.vat.validate("DK13585628");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = dk.vat.validate("DK13585629");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("cannot start with 0", () => {
    const r = dk.vat.validate("DK01234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("metadata", () => {
    expect(dk.vat.country).toBe("DK");
  });
});

// ─── Estonia ─────────────────────────────────────

describe("ee.vat", () => {
  test("valid Estonian VAT", () => {
    const r = ee.vat.validate("EE100931558");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = ee.vat.validate("EE100931559");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = ee.vat.validate("EE12345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(ee.vat.country).toBe("EE");
  });
});

// ─── Spain ───────────────────────────────────────

describe("es.vat", () => {
  test("valid DNI", () => {
    const r = es.vat.validate("ES12345678Z");
    expect(r.valid).toBe(true);
  });

  test("invalid DNI check letter", () => {
    const r = es.vat.validate("ES12345678A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("valid NIE (X prefix)", () => {
    const r = es.vat.validate("ESX5253868R");
    expect(r.valid).toBe(true);
  });

  test("valid NIE (Y prefix)", () => {
    const r = es.vat.validate("ESY1234567X");
    expect(r.valid).toBe(true);
  });

  test("valid CIF (letter check)", () => {
    const r = es.vat.validate("ESQ2876031B");
    expect(r.valid).toBe(true);
  });

  test("valid CIF (digit check)", () => {
    const r = es.vat.validate("ESA78304516");
    expect(r.valid).toBe(true);
  });

  test("wrong length", () => {
    const r = es.vat.validate("ES1234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(es.vat.country).toBe("ES");
    expect(es.vat.entityType).toBe("any");
  });
});

// ─── Finland ─────────────────────────────────────

describe("fi.vat", () => {
  test("valid Finnish VAT", () => {
    const r = fi.vat.validate("FI20774740");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = fi.vat.validate("FI20774741");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("metadata", () => {
    expect(fi.vat.country).toBe("FI");
  });
});

// ─── Greece ──────────────────────────────────────

describe("gr.vat", () => {
  test("valid Greek VAT", () => {
    const r = gr.vat.validate("EL094259216");
    expect(r.valid).toBe(true);
  });

  test("valid with GR prefix", () => {
    const r = gr.vat.validate("GR094259216");
    expect(r.valid).toBe(true);
  });

  test("valid 8-digit (zero-padded)", () => {
    const r = gr.vat.validate("EL94259216");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = gr.vat.validate("EL094259217");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("metadata", () => {
    expect(gr.vat.country).toBe("GR");
  });
});

// ─── Croatia ─────────────────────────────────────

describe("hr.vat", () => {
  test("valid Croatian VAT", () => {
    const r = hr.vat.validate("HR33392005961");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = hr.vat.validate("HR33392005962");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = hr.vat.validate("HR1234567890");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(hr.vat.country).toBe("HR");
  });
});

// ─── Hungary ─────────────────────────────────────

describe("hu.vat", () => {
  test("valid Hungarian VAT", () => {
    const r = hu.vat.validate("HU12892312");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = hu.vat.validate("HU12892313");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("metadata", () => {
    expect(hu.vat.country).toBe("HU");
  });
});

// ─── Ireland ─────────────────────────────────────

describe("ie.vat", () => {
  test("valid new-format Irish VAT", () => {
    const r = ie.vat.validate("IE6433435F");
    expect(r.valid).toBe(true);
  });

  test("valid new-format with trailing letter", () => {
    const r = ie.vat.validate("IE6433435OA");
    expect(r.valid).toBe(true);
  });

  test("valid old-format Irish VAT", () => {
    const r = ie.vat.validate("IE8D79739I");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = ie.vat.validate("IE6433435G");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = ie.vat.validate("IE123456");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(ie.vat.country).toBe("IE");
  });
});

// ─── Lithuania ───────────────────────────────────

describe("lt.vat", () => {
  test("valid 9-digit Lithuanian VAT", () => {
    const r = lt.vat.validate("LT119511515");
    expect(r.valid).toBe(true);
  });

  test("valid 12-digit Lithuanian VAT", () => {
    const r = lt.vat.validate("LT100001919017");
    expect(r.valid).toBe(true);
  });

  test("9-digit: d[7] must be 1", () => {
    const r = lt.vat.validate("LT119511525");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid checksum", () => {
    const r = lt.vat.validate("LT119511516");
    expect(r.valid).toBe(false);
  });

  test("metadata", () => {
    expect(lt.vat.country).toBe("LT");
  });
});

// ─── Luxembourg ──────────────────────────────────

describe("lu.vat", () => {
  test("valid Luxembourg VAT", () => {
    const r = lu.vat.validate("LU15027442");
    expect(r.valid).toBe(true);
  });

  test("verify checksum: 150274 % 89 = 42", () => {
    const r = lu.vat.validate("LU15027442");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = lu.vat.validate("LU15027443");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("metadata", () => {
    expect(lu.vat.country).toBe("LU");
  });
});

// ─── Latvia ──────────────────────────────────────

describe("lv.vat", () => {
  test("valid Latvian legal entity VAT", () => {
    const r = lv.vat.validate("LV40003521600");
    expect(r.valid).toBe(true);
  });

  test("valid Latvian personal VAT", () => {
    const r = lv.vat.validate("LV16117519997");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum (legal)", () => {
    const r = lv.vat.validate("LV40003521601");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = lv.vat.validate("LV1234567890");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(lv.vat.country).toBe("LV");
  });
});

// ─── Malta ───────────────────────────────────────

describe("mt.vat", () => {
  test("valid Maltese VAT", () => {
    const r = mt.vat.validate("MT11679112");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = mt.vat.validate("MT11679113");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("cannot start with 0", () => {
    const r = mt.vat.validate("MT01234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("metadata", () => {
    expect(mt.vat.country).toBe("MT");
  });
});

// ─── Netherlands ─────────────────────────────────

describe("nl.vat", () => {
  test("valid Dutch VAT", () => {
    const r = nl.vat.validate("NL123456789B13");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = nl.vat.validate("NL123456789B14");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("missing B", () => {
    const r = nl.vat.validate("NL123456789A13");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("wrong length", () => {
    const r = nl.vat.validate("NL12345678B0");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("metadata", () => {
    expect(nl.vat.country).toBe("NL");
  });
});

// ─── Portugal ────────────────────────────────────

describe("pt.vat", () => {
  test("valid Portuguese VAT", () => {
    const r = pt.vat.validate("PT501964843");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = pt.vat.validate("PT501964844");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("cannot start with 0", () => {
    const r = pt.vat.validate("PT012345678");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("metadata", () => {
    expect(pt.vat.country).toBe("PT");
  });
});

// ─── Romania ─────────────────────────────────────

describe("ro.vat", () => {
  test("valid Romanian VAT (short)", () => {
    const r = ro.vat.validate("RO18547290");
    expect(r.valid).toBe(true);
  });

  test("valid Romanian VAT (long)", () => {
    const r = ro.vat.validate("RO1630615123457");
    expect(r.valid).toBe(false);
    // Too long
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid checksum", () => {
    const r = ro.vat.validate("RO18547291");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("metadata", () => {
    expect(ro.vat.country).toBe("RO");
  });
});

// ─── Sweden ──────────────────────────────────────

describe("se.vat", () => {
  test("valid Swedish VAT", () => {
    const r = se.vat.validate("SE556188840401");
    expect(r.valid).toBe(true);
  });

  test("must end with 01", () => {
    const r = se.vat.validate("SE556188840402");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid Luhn", () => {
    const r = se.vat.validate("SE556188840501");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("metadata", () => {
    expect(se.vat.country).toBe("SE");
  });
});

// ─── Slovenia ────────────────────────────────────

describe("si.vat", () => {
  test("valid Slovenian VAT", () => {
    const r = si.vat.validate("SI15012557");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = si.vat.validate("SI15012558");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("cannot start with 0", () => {
    const r = si.vat.validate("SI01234567");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("metadata", () => {
    expect(si.vat.country).toBe("SI");
  });
});
