import { describe, expect, test } from "bun:test";

import { vn } from "../src";

describe("vn.mst", () => {
  const valid = [
    "0100233488", // 10-digit
    "0314409058002", // 13-digit (branch)
    "0100112437", // 10-digit
    "0312687878001", // 13-digit (branch)
  ];

  for (const v of valid) {
    test(`valid: ${v}`, () => {
      const r = vn.mst.validate(v);
      expect(r.valid).toBe(true);
    });
  }

  test("valid with dashes", () => {
    const r = vn.mst.validate("0314409058-002");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("0314409058002");
    }
  });

  test("valid with dots", () => {
    const r = vn.mst.validate("01.00.112.437");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("0100112437");
    }
  });

  test("valid with spaces and dash", () => {
    const r = vn.mst.validate("0312 68 78 78 - 001");
    expect(r.valid).toBe(true);
    if (r.valid) {
      expect(r.compact).toBe("0312687878001");
    }
  });

  test("invalid: bad checksum", () => {
    const r = vn.mst.validate("0100233480");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_CHECKSUM");
    }
  });

  test("invalid: sequential part 0000000", () => {
    const r = vn.mst.validate("0100000003");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid: branch suffix 000", () => {
    const r = vn.mst.validate("0100233488-000");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_COMPONENT");
    }
  });

  test("invalid: too short", () => {
    const r = vn.mst.validate("12345");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: wrong length (11 digits)", () => {
    const r = vn.mst.validate("01002334881");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_LENGTH");
    }
  });

  test("invalid: non-digit characters", () => {
    const r = vn.mst.validate("010023348A");
    expect(r.valid).toBe(false);
    if (!r.valid) {
      expect(r.error.code).toBe("INVALID_FORMAT");
    }
  });

  test("format 10-digit", () => {
    expect(vn.mst.format("0100233488")).toBe("0100233488");
  });

  test("format 13-digit", () => {
    expect(vn.mst.format("0314409058002")).toBe(
      "0314409058-002",
    );
  });

  test("compact strips separators", () => {
    expect(vn.mst.compact("01.00.233.488")).toBe(
      "0100233488",
    );
    expect(vn.mst.compact("0312 68 78 78 - 001")).toBe(
      "0312687878001",
    );
  });

  test("metadata", () => {
    expect(vn.mst.abbreviation).toBe("MST");
    expect(vn.mst.country).toBe("VN");
    expect(vn.mst.entityType).toBe("company");
  });
});
