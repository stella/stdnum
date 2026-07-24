<p align="center">
  <img src=".github/assets/banner.png" alt="stella" width="100%" />
</p>

# @stll/stdnum

Validate, compact, format, generate, and parse standard identifiers through a
single Rust implementation. The npm package uses a native N-API binding on
Node.js and Bun; `@stll/stdnum-wasm` serves browsers and edge runtimes, and the
same registry is available from Python as `stella-stdnum`.

<!-- BEGIN GENERATED: registry-summary -->

This package covers 11 global identifiers and 96 countries through 175
per-module entry points.

<!-- END GENERATED: registry-summary -->

## Install

```bash
npm install @stll/stdnum
# or
bun add @stll/stdnum
```

For browser or edge runtimes:

```bash
npm install @stll/stdnum-wasm
```

For Python 3.11 or newer:

```bash
pip install stella-stdnum
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

### Browser and edge runtimes

The WASM package exposes the registry API asynchronously:

```typescript
import { validate } from "@stll/stdnum-wasm";

await validate("cz.ico", "25596641");
```

### Python

```python
import stella_stdnum

result = stella_stdnum.validate("cz.ico", "25596641")
assert result.valid
assert result.compact == "25596641"
```

The Rust registry owns validator behavior and metadata. TypeScript subpaths,
catalog files, and exact TypeScript/Python registry types are generated from
that registry. One committed fixture set checks the Rust, Node.js, WASM, and
Python surfaces, and `ty` checks the installed Python wheel as a real consumer.

## Oracle Validation

The repo ships two oracle modes:

- `bun run oracle`
  Runs the strict gate. It keeps only
  high-confidence cross-checks that are stable enough
  for CI.
- `bun run oracle:survey`
  Runs the broader ecosystem survey. It includes
  noisier third-party validators and mutation probes to
  surface drift without treating every disagreement as a
  release blocker.

Both commands accept `ORACLE_SAMPLES=<n>` to trade off
runtime against coverage.

Dependabot watches every JavaScript, Python, Ruby, PHP, and Rust oracle
manifest. Its weekly update PRs rerun the strict oracle gate against the new
upstream versions before they can merge.

## Supported Identifiers

<!-- BEGIN GENERATED: supported-identifiers -->

### International

| Identifier                                     | Module             | Type    |
| ---------------------------------------------- | ------------------ | ------- |
| Business Identifier Code                       | `bic`              | company |
| Credit Card Number                             | `creditcard`       | any     |
| Bitcoin Base58Check Address                    | `crypto/btcbase58` | any     |
| Bitcoin Bech32 Address                         | `crypto/btcbech32` | any     |
| Ethereum Address                               | `crypto/eth`       | any     |
| Cryptocurrency Wallet Address                  | `crypto/wallet`    | any     |
| EU VAT Number                                  | `eu/vat`           | company |
| IBAN                                           | `iban`             | any     |
| International Securities Identification Number | `isin`             | any     |
| Legal Entity Identifier                        | `lei`              | company |
| Luhn                                           | `luhn`             | any     |

### Countries

<details>
<summary>96 countries supported (click to expand)</summary>

| Country | Module             | Identifier   |
| ------- | ------------------ | ------------ |
| AD      | `ad/nrt`           | NRT          |
| AE      | `ae/eid`           | EID          |
| AI      | `ai/tin`           | TIN          |
| AL      | `al/nipt`          | NIPT         |
| AM      | `am/tin`           | TIN          |
| AR      | `ar/cbu`           | CBU          |
|         | `ar/cuit`          | CUIT         |
|         | `ar/dni`           | DNI          |
| AT      | `at/businessid`    | FN           |
|         | `at/tin`           | TIN          |
|         | `at/uid`           | UID          |
|         | `at/vnr`           | VNR          |
| AU      | `au/abn`           | ABN          |
|         | `au/acn`           | ACN          |
|         | `au/tfn`           | TFN          |
| AZ      | `az/voen`          | VÖEN         |
| BA      | `ba/jmbg`          | JMBG         |
| BD      | `bd/nid`           | NID          |
| BE      | `be/bis`           | BIS          |
|         | `be/nn`            | NN           |
|         | `be/vat`           | BTW          |
| BG      | `bg/egn`           | ЕГН          |
|         | `bg/pnf`           | ЛНЧ          |
|         | `bg/vat`           | ИН по ДДС    |
| BH      | `bh/cpr`           | CPR          |
| BR      | `br/cnpj`          | CNPJ         |
|         | `br/cpf`           | CPF          |
| BY      | `by/unp`           | УНП          |
| BZ      | `bz/tin`           | TIN          |
| CA      | `ca/bn`            | BN           |
|         | `ca/sin`           | SIN          |
| CH      | `ch/ssn`           | AHV          |
|         | `ch/uid`           | UID          |
|         | `ch/vat`           | MWST         |
| CL      | `cl/rut`           | RUT          |
| CN      | `cn/ric`           | RIC          |
|         | `cn/uscc`          | USCC         |
| CO      | `co/nit`           | NIT          |
| CR      | `cr/cpf`           | CPF          |
| CU      | `cu/ni`            | NI           |
| CY      | `cy/vat`           | ΦΠΑ          |
| CZ      | `cz/dic`           | DIČ          |
|         | `cz/ico`           | IČO          |
|         | `cz/rc`            | RČ           |
| DE      | `de/handelsreg`    | HReg         |
|         | `de/idnr`          | IdNr         |
|         | `de/stnr`          | StNr         |
|         | `de/svnr`          | SVNR         |
|         | `de/vat`           | USt-IdNr.    |
| DK      | `dk/cpr`           | CPR          |
|         | `dk/cvr`           | CVR          |
|         | `dk/vat`           | CVR          |
| DO      | `do/rnc`           | RNC          |
| EC      | `ec/ruc`           | RUC          |
| EE      | `ee/ik`            | IK           |
|         | `ee/registrikood`  | Registrikood |
|         | `ee/vat`           | KMKR         |
| EG      | `eg/tn`            | TN           |
| ES      | `es/cif`           | CIF          |
|         | `es/dni`           | DNI          |
|         | `es/nie`           | NIE          |
|         | `es/nss`           | NSS          |
|         | `es/vat`           | NIF          |
| FI      | `fi/hetu`          | HETU         |
|         | `fi/vat`           | ALV nro      |
|         | `fi/ytunnus`       | Y-tunnus     |
| FR      | `fr/nif`           | NIF          |
|         | `fr/nir`           | NIR          |
|         | `fr/siren`         | SIREN        |
|         | `fr/siret`         | SIRET        |
|         | `fr/tva`           | TVA          |
| GB      | `gb/nhs`           | NHS          |
|         | `gb/nino`          | NINO         |
|         | `gb/sedol`         | SEDOL        |
|         | `gb/utr`           | UTR          |
|         | `gb/vat`           | VAT          |
| GE      | `ge/pin`           | PIN          |
| GH      | `gh/tin`           | TIN          |
| GR      | `gr/amka`          | ΑΜΚΑ         |
|         | `gr/vat`           | ΑΦΜ          |
| GT      | `gt/nit`           | NIT          |
| HK      | `hk/hkid`          | HKID         |
| HR      | `hr/vat`           | OIB          |
| HU      | `hu/vat`           | ANUM         |
| ID      | `id/npwp`          | NPWP         |
| IE      | `ie/pps`           | PPS          |
|         | `ie/vat`           | VAT          |
| IL      | `il/idnr`          | ת.ז.         |
| IN      | `in/aadhaar`       | Aadhaar      |
|         | `in/gstin`         | GSTIN        |
|         | `in/pan`           | PAN          |
| IQ      | `iq/nid`           | NID          |
| IR      | `ir/nid`           | NID          |
| IS      | `is/kennitala`     | kt.          |
|         | `is/vsk`           | VSK          |
| IT      | `it/codicefiscale` | CF           |
|         | `it/iva`           | P.IVA        |
| JP      | `jp/cn`            | CN           |
|         | `jp/mynumber`      | My Number    |
| KR      | `kr/brn`           | BRN          |
|         | `kr/rrn`           | RRN          |
| KW      | `kw/civil`         | Civil ID     |
| KZ      | `kz/iin`           | IIN          |
| LI      | `li/peid`          | PEID         |
| LK      | `lk/nic`           | NIC          |
| LT      | `lt/asmens`        | AK           |
|         | `lt/vat`           | PVM kodas    |
| LU      | `lu/vat`           | TVA          |
| LV      | `lv/vat`           | PVN          |
| MA      | `ma/ice`           | ICE          |
| MC      | `mc/tva`           | TVA          |
| MD      | `md/idno`          | IDNO         |
| ME      | `me/pib`           | PIB          |
| MK      | `mk/edb`           | EDB          |
| MT      | `mt/vat`           | VAT          |
| MU      | `mu/brn`           | BRN          |
| MX      | `mx/clabe`         | CLABE        |
|         | `mx/curp`          | CURP         |
|         | `mx/rfc`           | RFC          |
| MY      | `my/nric`          | NRIC         |
| NG      | `ng/nin`           | NIN          |
| NI      | `ni/ruc`           | RUC          |
| NL      | `nl/bsn`           | BSN          |
|         | `nl/kvk`           | KvK          |
|         | `nl/vat`           | BTW          |
| NO      | `no/fodselsnummer` | Fødselsnr    |
|         | `no/mva`           | MVA          |
|         | `no/orgnr`         | Orgnr        |
| NZ      | `nz/ird`           | IRD          |
| PA      | `pa/ruc`           | RUC          |
| PE      | `pe/ruc`           | RUC          |
| PH      | `ph/philid`        | PhilID       |
| PK      | `pk/cnic`          | CNIC         |
| PL      | `pl/nip`           | NIP          |
|         | `pl/pesel`         | PESEL        |
|         | `pl/regon`         | REGON        |
| PT      | `pt/cc`            | CC           |
|         | `pt/vat`           | NIF          |
| RO      | `ro/cnp`           | CNP          |
|         | `ro/vat`           | CIF          |
| RS      | `rs/pib`           | PIB          |
| RU      | `ru/inn`           | ИНН          |
| SE      | `se/orgnr`         | Orgnr        |
|         | `se/personnummer`  | PN           |
|         | `se/vat`           | Momsnr.      |
| SG      | `sg/uen`           | UEN          |
| SI      | `si/emso`          | EMŠO         |
|         | `si/vat`           | DDV          |
| SK      | `sk/dic`           | IČ DPH       |
|         | `sk/ico`           | IČO          |
|         | `sk/rc`            | RČ           |
| TH      | `th/tin`           | TIN          |
| TR      | `tr/tckimlik`      | T.C. Kimlik  |
|         | `tr/vkn`           | VKN          |
| TW      | `tw/ubn`           | UBN          |
| UA      | `ua/edrpou`        | ЄДРПОУ       |
| US      | `us/ein`           | EIN          |
|         | `us/itin`          | ITIN         |
|         | `us/rtn`           | RTN          |
|         | `us/ssn`           | SSN          |
| UY      | `uy/rut`           | RUT          |
| VE      | `ve/rif`           | RIF          |
| VN      | `vn/mst`           | MST          |
| ZA      | `za/idnr`          | SA ID        |

</details>
<!-- END GENERATED: supported-identifiers -->

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

  // Optional metadata
  description?: string;
  sourceUrl?: string;
  lengths?: readonly number[];
  examples?: readonly string[];
  aliases?: readonly string[];
  candidatePattern?: string;

  // Available on most validators
  generate?: () => string;
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

Many person-type validators export `parse()`, returning
structured data extracted from the identifier:

```typescript
import { cz } from "@stll/stdnum";

cz.rc.parse("7103192745");
// { birthDate: Date, gender: "male" }
```

Validators with `parse()`: BA JMBG, BG ЕГН, CN RIC,
CU NI, CZ RČ, DK CPR, EE IK, FI HETU, FR NIR,
IT CF, KR RRN, KW Civil ID, KZ IIN, LK NIC,
MX CURP, MY NRIC, NO Fødselsnr, PL PESEL, RO CNP,
SE PN, SI EMŠO, SK RČ, ZA SA ID.

`detectNetwork()` and the `CardNetwork` type are
top-level named exports:

```typescript
import { detectNetwork } from "@stll/stdnum";
import type { CardNetwork } from "@stll/stdnum";

detectNetwork("4111111111111111");
// "visa"
```

## Unicode handling

All validators normalize Unicode artifacts before
validation: fullwidth digits, various dashes,
non-breaking spaces, zero-width characters, and
other common OCR/PDF copy-paste issues are
handled automatically.

## Development

```bash
bun install
bun run rust:check
bun run codegen:check
bun run typecheck
bun test
bun run lint     # oxlint
bun run format   # oxfmt
```

## License

[MIT](./LICENSE)
