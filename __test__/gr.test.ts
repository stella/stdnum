import { describe, expect, test } from "bun:test";

import { gr } from "../src";

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
