<p align="center">
  <img src=".github/assets/banner.png" alt="Stella" width="100%" />
</p>

# @stll/stdnum

Validate, compact, and format standard
identifiers. Pure TypeScript, zero dependencies,
tree-shakeable.

## Install

```bash
npm install @stll/stdnum
# or
bun add @stll/stdnum
```

## Usage

```typescript
import { cz } from "@stll/stdnum";

cz.ico.validate("25596641");
// { valid: true, compact: "25596641" }

cz.ico.validate("12345678");
// { valid: false, error: { code: "INVALID_CHECKSUM", ... } }

cz.rc.format("7103192745");
// "710319/2745"
```

### Tree-shaking

Import only what you need:

```typescript
import ico from "@stll/stdnum/cz/ico";
import iban from "@stll/stdnum/iban";

ico.validate("25596641");
iban.validate("CZ65 0800 0000 1920 0014 5399");
```

## Supported Identifiers

### Czech Republic

| Identifier        | Module   | Type    |
| ----------------- | -------- | ------- |
| IČO (Company ID)  | `cz/ico` | company |
| DIČ (VAT Number)  | `cz/dic` | any     |
| RČ (Birth Number) | `cz/rc`  | person  |

### Slovakia

| Identifier          | Module   | Type    |
| ------------------- | -------- | ------- |
| RČ (Birth Number)   | `sk/rc`  | person  |
| IČ DPH (VAT Number) | `sk/dic` | company |

### Germany

| Identifier         | Module    | Type    |
| ------------------ | --------- | ------- |
| USt-IdNr. (VAT ID) | `de/vat`  | company |
| IdNr (Tax ID)      | `de/idnr` | person  |

### Poland

| Identifier                | Module     | Type    |
| ------------------------- | ---------- | ------- |
| NIP (VAT Number)          | `pl/nip`   | company |
| PESEL (National ID)       | `pl/pesel` | person  |
| REGON (Business Register) | `pl/regon` | company |

### International

| Identifier         | Module | Type    |
| ------------------ | ------ | ------- |
| IBAN               | `iban` | any     |
| Credit Card (Luhn) | `luhn` | any     |
| LEI                | `lei`  | company |

## API

Every identifier exports the same interface:

```typescript
type Validator = {
  name: string;
  localName: string;
  abbreviation: string;
  country?: CountryCode;
  entityType: "person" | "company" | "any";
  compact: (value: string) => string;
  format: (value: string) => string;
  validate: (value: string) => ValidateResult;
};

type ValidateResult =
  | { valid: true; compact: string }
  | {
      valid: false;
      error: {
        code:
          | "INVALID_FORMAT"
          | "INVALID_LENGTH"
          | "INVALID_CHECKSUM"
          | "INVALID_COMPONENT";
        message: string;
      };
    };
```

### Additional exports

- `cz.rc` exports `parse(value)` returning
  `{ birthDate: Date, gender: "male" | "female" }`

## Unicode handling

All validators normalize Unicode artifacts before
validation: fullwidth digits, various dashes,
non-breaking spaces, zero-width characters, and
other common OCR/PDF copy-paste issues are
handled automatically.

## Development

```bash
bun install
bun test         # 76 tests
bun run lint     # oxlint
bun run format   # oxfmt
```

## License

[MIT](./LICENSE)
