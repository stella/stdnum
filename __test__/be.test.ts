import { describe, expect, test } from "bun:test";

import { be } from "../src";

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

  test("wrong length (too short)", () => {
    const r = be.vat.validate("BE07760919");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("9-digit zero-padded", () => {
    // Old 9-digit format gets 0-prepended
    const r = be.vat.validate("BE776091951");
    expect(r.valid).toBe(
      be.vat.validate("BE0776091951").valid,
    );
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

// ─── NN (National Number) ───────────────────

describe("be.nn", () => {
  test("valid NN", () => {
    const r = be.nn.validate("85073003328");
    expect(r.valid).toBe(true);
  });

  test("invalid NN", () => {
    const r = be.nn.validate("12345678901");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = be.nn.validate("1234567890");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("non-digit", () => {
    const r = be.nn.validate("8507300332A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("compact strips separators", () => {
    expect(be.nn.compact("85.07.30-033.28")).toBe(
      "85073003328",
    );
  });

  test("format adds separators", () => {
    expect(be.nn.format("85073003328")).toBe(
      "85.07.30-033.28",
    );
  });

  test("metadata", () => {
    expect(be.nn.country).toBe("BE");
    expect(be.nn.entityType).toBe("person");
  });
});

// ─── BIS (BIS-nummer) ────────────────────────

describe("be.bis", () => {
  test("valid BIS", () => {
    const r = be.bis.validate("98472899765");
    expect(r.valid).toBe(true);
  });

  test("invalid checksum", () => {
    const r = be.bis.validate("98472899766");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("wrong length", () => {
    const r = be.bis.validate("9847289976");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid month range", () => {
    const r = be.bis.validate("85073003328");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("format uses NN separators", () => {
    expect(be.bis.format("98472899765")).toBe(
      "98.47.28-997.65",
    );
  });

  test("metadata", () => {
    expect(be.bis.country).toBe("BE");
    expect(be.bis.entityType).toBe("person");
  });
});
