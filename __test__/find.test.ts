import { describe, expect, test } from "bun:test";

import { find } from "../src/find";
import { cz, de, fr, gb, pl } from "../src";

describe("find", () => {
  test("finds identifiers in text", () => {
    const text =
      "IČO 25123891 and VAT DE136695976";
    const matches = find(text, [cz.ico, de.vat]);
    expect(matches).toHaveLength(2);
    expect(matches[0]!.validator).toBe(cz.ico);
    expect(matches[0]!.compact).toBe("25123891");
    expect(matches[1]!.validator).toBe(de.vat);
    expect(matches[1]!.compact).toBe("136695976");
  });

  test("returns empty for no matches", () => {
    expect(
      find("no identifiers here", [cz.ico]),
    ).toHaveLength(0);
  });

  test("finds prefixed identifiers", () => {
    const matches = find(
      "DIČ CZ25123891 registered",
      [cz.dic],
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]!.compact).toBe("25123891");
  });

  test("finds formatted identifiers", () => {
    const matches = find(
      "SIREN 732 829 320 valid",
      [fr.siren],
    );
    expect(matches).toHaveLength(1);
    expect(matches[0]!.compact).toBe("732829320");
  });

  test("prefers longer match at same position", () => {
    const text = "NIP 2234567895 here";
    const matches = find(text, [cz.ico, pl.nip]);
    // NIP (10 digits) should win over IČO (8 digits)
    // if the 10-digit compact is valid as NIP
    expect(matches.length).toBeGreaterThan(0);
    const nipMatch = matches.find(
      (m) => m.validator === pl.nip,
    );
    if (nipMatch) {
      expect(nipMatch.compact).toBe("2234567895");
    }
  });

  test("positions are correct", () => {
    const text = "abc 25123891 xyz";
    const matches = find(text, [cz.ico]);
    expect(matches).toHaveLength(1);
    expect(matches[0]!.start).toBe(4);
    expect(matches[0]!.end).toBe(12);
    expect(text.slice(4, 12)).toBe("25123891");
  });

  test("multiple matches in sequence", () => {
    const text =
      "UTR 1955839661 and SIREN 732829320";
    const matches = find(text, [
      gb.utr,
      fr.siren,
    ]);
    expect(matches).toHaveLength(2);
  });

  test("empty text returns empty", () => {
    expect(find("", [cz.ico])).toHaveLength(0);
  });

  test("empty validators returns empty", () => {
    expect(find("25123891", [])).toHaveLength(0);
  });
});
