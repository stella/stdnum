import { describe, expect, test } from "bun:test";

import creditcard from "../src/creditcard";
import ico from "../src/cz/ico";
import rc from "../src/cz/rc";
import vat from "../src/de/vat";
import iban from "../src/iban";
import luhn from "../src/luhn";
import nip from "../src/pl/nip";

const ITERATIONS = 100;

const testGenerator = (
  name: string,
  validator: {
    generate?: () => string;
    validate: (v: string) => { valid: boolean };
  },
) => {
  describe(`${name}.generate()`, () => {
    test("is defined", () => {
      expect(validator.generate).toBeDefined();
    });

    test(`produces valid values (${String(ITERATIONS)}x)`, () => {
      for (let i = 0; i < ITERATIONS; i++) {
        // eslint-disable-next-line no-non-null-assertion
        const value = validator.generate!();
        const result = validator.validate(value);
        if (!result.valid) {
          expect(
            `${name}.generate() => "${value}" failed`,
          ).toBe("valid");
        }
        expect(result.valid).toBe(true);
      }
    });

    test("returns a compact string", () => {
      // eslint-disable-next-line no-non-null-assertion
      const value = validator.generate!();
      expect(value).not.toContain(" ");
      expect(value).not.toContain("-");
      expect(value).not.toContain("/");
    });
  });
};

testGenerator("luhn", luhn);
testGenerator("cz/ico", ico);
testGenerator("cz/rc", rc);
testGenerator("de/vat", vat);
testGenerator("pl/nip", nip);
testGenerator("iban", iban);
testGenerator("creditcard", creditcard);

describe("creditcard.generate() specifics", () => {
  test("produces 16-digit Visa or Mastercard", () => {
    for (let i = 0; i < 50; i++) {
      // eslint-disable-next-line no-non-null-assertion
      const value = creditcard.generate!();
      expect(value.length).toBe(16);
      const first = value[0];
      expect(first === "4" || first === "5").toBe(true);
    }
  });
});

describe("iban.generate() specifics", () => {
  test("produces CZ, DE, or SK IBAN", () => {
    const countries = new Set<string>();
    for (let i = 0; i < 100; i++) {
      // eslint-disable-next-line no-non-null-assertion
      const value = iban.generate!();
      const cc = value.slice(0, 2);
      expect(["CZ", "DE", "SK"]).toContain(cc);
      countries.add(cc);
    }
    expect(countries.size).toBeGreaterThanOrEqual(2);
  });
});

describe("luhn.generate() specifics", () => {
  test("produces 16-digit number by default", () => {
    // eslint-disable-next-line no-non-null-assertion
    const value = luhn.generate!();
    expect(value.length).toBe(16);
  });
});
