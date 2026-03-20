import { describe, expect, test } from "bun:test";

import { parse as parseCzRc } from "../src/cz/rc";
import { parse as parseSkRc } from "../src/sk/rc";
import { parse as parseBgEgn } from "../src/bg/egn";
import { parse as parseDkCpr } from "../src/dk/cpr";
import { parse as parseEeIk } from "../src/ee/ik";
import { parse as parseFiHetu } from "../src/fi/hetu";
import {
  parse as parseItCf,
} from "../src/it/codicefiscale";
import {
  parse as parseNoFnr,
} from "../src/no/fodselsnummer";
import { parse as parsePlPesel } from "../src/pl/pesel";
import { parse as parseRoCnp } from "../src/ro/cnp";
import {
  parse as parseSePersonnummer,
} from "../src/se/personnummer";
import { parse as parseSiEmso } from "../src/si/emso";

describe("cz.rc parse", () => {
  test("extracts male born 1971-03-19", () => {
    const result = parseCzRc("7103192745");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1971);
    expect(result!.birthDate.getMonth()).toBe(2);
    expect(result!.birthDate.getDate()).toBe(19);
  });

  test("extracts female (month + 50)", () => {
    const result = parseCzRc("715319/1001");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("female");
    expect(result!.birthDate.getMonth()).toBe(2);
  });

  test("returns null for invalid input", () => {
    expect(parseCzRc("invalid")).toBeNull();
    expect(parseCzRc("7103192746")).toBeNull();
  });
});

describe("sk.rc parse", () => {
  test("delegates to cz.rc parse", () => {
    const result = parseSkRc("7103192745");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1971);
  });
});

describe("bg.egn parse", () => {
  test("extracts date and gender", () => {
    const result = parseBgEgn("7523169263");
    expect(result).not.toBeNull();
    expect(result!.birthDate.getFullYear()).toBe(1875);
    expect(result!.birthDate.getMonth()).toBe(2);
    expect(result!.birthDate.getDate()).toBe(16);
  });

  test("returns null for invalid input", () => {
    expect(parseBgEgn("invalid")).toBeNull();
    expect(parseBgEgn("7523169264")).toBeNull();
  });
});

describe("dk.cpr parse", () => {
  test("extracts male born 1862-10-21", () => {
    const result = parseDkCpr("2110625629");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1862);
    expect(result!.birthDate.getMonth()).toBe(9);
    expect(result!.birthDate.getDate()).toBe(21);
  });

  test("returns null for invalid input", () => {
    expect(parseDkCpr("invalid")).toBeNull();
  });
});

describe("ee.ik parse", () => {
  test("extracts male born 1968-05-28", () => {
    const result = parseEeIk("36805280109");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1968);
    expect(result!.birthDate.getMonth()).toBe(4);
    expect(result!.birthDate.getDate()).toBe(28);
  });

  test("returns null for invalid input", () => {
    expect(parseEeIk("invalid")).toBeNull();
  });
});

describe("fi.hetu parse", () => {
  test("extracts female born 1952-10-13", () => {
    const result = parseFiHetu("131052-308T");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("female");
    expect(result!.birthDate.getFullYear()).toBe(1952);
    expect(result!.birthDate.getMonth()).toBe(9);
    expect(result!.birthDate.getDate()).toBe(13);
  });

  test("returns null for invalid input", () => {
    expect(parseFiHetu("invalid")).toBeNull();
  });
});

describe("it.codicefiscale parse", () => {
  test("extracts male born 1983-11-18", () => {
    const result = parseItCf("RCCMNL83S18D969H");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1983);
    expect(result!.birthDate.getMonth()).toBe(10);
    expect(result!.birthDate.getDate()).toBe(18);
  });

  test("returns null for invalid input", () => {
    expect(parseItCf("invalid")).toBeNull();
  });

  test("returns null for 11-digit IVA", () => {
    expect(parseItCf("00743110157")).toBeNull();
  });
});

describe("no.fodselsnummer parse", () => {
  test("extracts female born 1986-10-15", () => {
    const result = parseNoFnr("15108695088");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("female");
    expect(result!.birthDate.getFullYear()).toBe(1986);
    expect(result!.birthDate.getMonth()).toBe(9);
    expect(result!.birthDate.getDate()).toBe(15);
  });

  test("returns null for invalid input", () => {
    expect(parseNoFnr("invalid")).toBeNull();
  });
});

describe("pl.pesel parse", () => {
  test("extracts male born 1944-05-14", () => {
    const result = parsePlPesel("44051401359");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1944);
    expect(result!.birthDate.getMonth()).toBe(4);
    expect(result!.birthDate.getDate()).toBe(14);
  });

  test("extracts 1900s date from month <= 12", () => {
    const result = parsePlPesel("02070803628");
    expect(result).not.toBeNull();
    expect(result!.birthDate.getFullYear()).toBe(1902);
    expect(result!.birthDate.getMonth()).toBe(6);
  });

  test("returns null for invalid input", () => {
    expect(parsePlPesel("invalid")).toBeNull();
    expect(parsePlPesel("44051401358")).toBeNull();
  });
});

describe("ro.cnp parse", () => {
  test("extracts male born 1963-06-15", () => {
    const result = parseRoCnp("1630615123457");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(1963);
    expect(result!.birthDate.getMonth()).toBe(5);
    expect(result!.birthDate.getDate()).toBe(15);
  });

  test("returns null for invalid input", () => {
    expect(parseRoCnp("invalid")).toBeNull();
  });
});

describe("se.personnummer parse", () => {
  test("extracts from valid personnummer", () => {
    const result = parseSePersonnummer("8803200016");
    expect(result).not.toBeNull();
    expect(result!.birthDate.getFullYear()).toBe(1988);
    expect(result!.birthDate.getMonth()).toBe(2);
    expect(result!.birthDate.getDate()).toBe(20);
    expect(result!.gender).toBe("male");
  });

  test("returns null for invalid input", () => {
    expect(parseSePersonnummer("invalid")).toBeNull();
  });
});

describe("si.emso parse", () => {
  test("extracts male born 2006-01-01", () => {
    const result = parseSiEmso("0101006500006");
    expect(result).not.toBeNull();
    expect(result!.gender).toBe("male");
    expect(result!.birthDate.getFullYear()).toBe(2006);
    expect(result!.birthDate.getMonth()).toBe(0);
    expect(result!.birthDate.getDate()).toBe(1);
  });

  test("returns null for invalid input", () => {
    expect(parseSiEmso("invalid")).toBeNull();
  });
});
