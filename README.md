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

### International

| Identifier         | Module       | Type    |
| ------------------ | ------------ | ------- |
| BIC (ISO 9362)     | `bic`        | company |
| Credit Card (Luhn) | `creditcard` | any     |
| IBAN               | `iban`       | any     |
| ISIN (ISO 6166)    | `isin`       | any     |
| LEI                | `lei`        | company |
| Luhn               | `luhn`       | any     |
| EU VAT             | `eu/vat`     | company |

### Countries

<details>
<summary>96 countries supported (click to expand)</summary>

| Country                   | Module             | Identifier   |
| ------------------------- | ------------------ | ------------ |
| AD Andorra                | `ad/nrt`           | NRT          |
| AE United Arab Emirates   | `ae/eid`           | EID          |
| AI Anguilla               | `ai/tin`           | TIN          |
| AL Albania                | `al/nipt`          | NIPT         |
| AM Armenia                | `am/tin`           | TIN          |
| AR Argentina              | `ar/cbu`           | CBU          |
|                           | `ar/cuit`          | CUIT         |
|                           | `ar/dni`           | DNI          |
| AT Austria                | `at/businessid`    | FN           |
|                           | `at/tin`           | TIN          |
|                           | `at/uid`           | UID          |
|                           | `at/vnr`           | VNR          |
| AU Australia              | `au/abn`           | ABN          |
|                           | `au/acn`           | ACN          |
|                           | `au/tfn`           | TFN          |
| AZ Azerbaijan             | `az/voen`          | VÖEN         |
| BA Bosnia and Herzegovina | `ba/jmbg`          | JMBG         |
| BD Bangladesh             | `bd/nid`           | NID          |
| BE Belgium                | `be/bis`           | BIS          |
|                           | `be/nn`            | NN           |
|                           | `be/vat`           | BTW          |
| BG Bulgaria               | `bg/egn`           | ЕГН          |
|                           | `bg/pnf`           | ЛНЧ          |
|                           | `bg/vat`           | ИН по ДДС    |
| BH Bahrain                | `bh/cpr`           | CPR          |
| BR Brazil                 | `br/cnpj`          | CNPJ         |
|                           | `br/cpf`           | CPF          |
| BY Belarus                | `by/unp`           | УНП          |
| BZ Belize                 | `bz/tin`           | TIN          |
| CA Canada                 | `ca/bn`            | BN           |
|                           | `ca/sin`           | SIN          |
| CH Switzerland            | `ch/ssn`           | AHV          |
|                           | `ch/uid`           | UID          |
|                           | `ch/vat`           | MWST         |
| CL Chile                  | `cl/rut`           | RUT          |
| CN China                  | `cn/ric`           | RIC          |
|                           | `cn/uscc`          | USCC         |
| CO Colombia               | `co/nit`           | NIT          |
| CR Costa Rica             | `cr/cpf`           | CPF          |
| CU Cuba                   | `cu/ni`            | NI           |
| CY Cyprus                 | `cy/vat`           | ΦΠΑ          |
| CZ Czech Republic         | `cz/dic`           | DIČ          |
|                           | `cz/ico`           | IČO          |
|                           | `cz/rc`            | RČ           |
| DE Germany                | `de/handelsreg`    | HReg         |
|                           | `de/idnr`          | IdNr         |
|                           | `de/stnr`          | StNr         |
|                           | `de/svnr`          | SVNR         |
|                           | `de/vat`           | USt-IdNr.    |
| DK Denmark                | `dk/cpr`           | CPR          |
|                           | `dk/cvr`           | CVR          |
|                           | `dk/vat`           | CVR          |
| DO Dominican Republic     | `do/rnc`           | RNC          |
| EC Ecuador                | `ec/ruc`           | RUC          |
| EE Estonia                | `ee/ik`            | IK           |
|                           | `ee/registrikood`  | Registrikood |
|                           | `ee/vat`           | KMKR         |
| EG Egypt                  | `eg/tn`            | TN           |
| ES Spain                  | `es/cif`           | CIF          |
|                           | `es/dni`           | DNI          |
|                           | `es/nie`           | NIE          |
|                           | `es/nss`           | NSS          |
|                           | `es/vat`           | NIF          |
| FI Finland                | `fi/hetu`          | HETU         |
|                           | `fi/vat`           | ALV nro      |
|                           | `fi/ytunnus`       | Y-tunnus     |
| FR France                 | `fr/nif`           | NIF          |
|                           | `fr/nir`           | NIR          |
|                           | `fr/siren`         | SIREN        |
|                           | `fr/siret`         | SIRET        |
|                           | `fr/tva`           | TVA          |
| GB United Kingdom         | `gb/nino`          | NINO         |
|                           | `gb/sedol`         | SEDOL        |
|                           | `gb/utr`           | UTR          |
|                           | `gb/vat`           | VAT          |
| GE Georgia                | `ge/pin`           | PIN          |
| GH Ghana                  | `gh/tin`           | TIN          |
| GR Greece                 | `gr/amka`          | ΑΜΚΑ         |
|                           | `gr/vat`           | ΑΦΜ          |
| GT Guatemala              | `gt/nit`           | NIT          |
| HK Hong Kong              | `hk/hkid`          | HKID         |
| HR Croatia                | `hr/vat`           | OIB          |
| HU Hungary                | `hu/vat`           | ANUM         |
| ID Indonesia              | `id/npwp`          | NPWP         |
| IE Ireland                | `ie/pps`           | PPS          |
|                           | `ie/vat`           | VAT          |
| IL Israel                 | `il/idnr`          | ת.ז.         |
| IN India                  | `in/aadhaar`       | Aadhaar      |
|                           | `in/gstin`         | GSTIN        |
|                           | `in/pan`           | PAN          |
| IQ Iraq                   | `iq/nid`           | NID          |
| IR Iran                   | `ir/nid`           | NID          |
| IS Iceland                | `is/kennitala`     | kt.          |
|                           | `is/vsk`           | VSK          |
| IT Italy                  | `it/codicefiscale` | CF           |
|                           | `it/iva`           | P.IVA        |
| JP Japan                  | `jp/cn`            | CN           |
|                           | `jp/mynumber`      | My Number    |
| KR South Korea            | `kr/brn`           | BRN          |
|                           | `kr/rrn`           | RRN          |
| KW Kuwait                 | `kw/civil`         | Civil ID     |
| KZ Kazakhstan             | `kz/iin`           | IIN          |
| LI Liechtenstein          | `li/peid`          | PEID         |
| LK Sri Lanka              | `lk/nic`           | NIC          |
| LT Lithuania              | `lt/asmens`        | AK           |
|                           | `lt/vat`           | PVM kodas    |
| LU Luxembourg             | `lu/vat`           | TVA          |
| LV Latvia                 | `lv/vat`           | PVN          |
| MA Morocco                | `ma/ice`           | ICE          |
| MC Monaco                 | `mc/tva`           | TVA          |
| MD Moldova                | `md/idno`          | IDNO         |
| ME Montenegro             | `me/pib`           | PIB          |
| MK North Macedonia        | `mk/edb`           | EDB          |
| MT Malta                  | `mt/vat`           | VAT          |
| MU Mauritius              | `mu/brn`           | BRN          |
| MX Mexico                 | `mx/clabe`         | CLABE        |
|                           | `mx/curp`          | CURP         |
|                           | `mx/rfc`           | RFC          |
| MY Malaysia               | `my/nric`          | NRIC         |
| NG Nigeria                | `ng/nin`           | NIN          |
| NI Nicaragua              | `ni/ruc`           | RUC          |
| NL Netherlands            | `nl/bsn`           | BSN          |
|                           | `nl/kvk`           | KvK          |
|                           | `nl/vat`           | BTW          |
| NO Norway                 | `no/fodselsnummer` | Fødselsnr    |
|                           | `no/mva`           | MVA          |
|                           | `no/orgnr`         | Orgnr        |
| NZ New Zealand            | `nz/ird`           | IRD          |
| PA Panama                 | `pa/ruc`           | RUC          |
| PE Peru                   | `pe/ruc`           | RUC          |
| PH Philippines            | `ph/philid`        | PhilID       |
| PK Pakistan               | `pk/cnic`          | CNIC         |
| PL Poland                 | `pl/nip`           | NIP          |
|                           | `pl/pesel`         | PESEL        |
|                           | `pl/regon`         | REGON        |
| PT Portugal               | `pt/cc`            | CC           |
|                           | `pt/vat`           | NIF          |
| RO Romania                | `ro/cnp`           | CNP          |
|                           | `ro/vat`           | CIF          |
| RS Serbia                 | `rs/pib`           | PIB          |
| RU Russia                 | `ru/inn`           | ИНН          |
| SE Sweden                 | `se/orgnr`         | Orgnr        |
|                           | `se/personnummer`  | PN           |
|                           | `se/vat`           | Momsnr.      |
| SG Singapore              | `sg/uen`           | UEN          |
| SI Slovenia               | `si/emso`          | EMŠO         |
|                           | `si/vat`           | DDV          |
| SK Slovakia               | `sk/dic`           | IČ DPH       |
|                           | `sk/ico`           | IČO          |
|                           | `sk/rc`            | RČ           |
| TH Thailand               | `th/tin`           | TIN          |
| TR Turkey                 | `tr/tckimlik`      | T.C. Kimlik  |
|                           | `tr/vkn`           | VKN          |
| TW Taiwan                 | `tw/ubn`           | UBN          |
| UA Ukraine                | `ua/edrpou`        | ЄДРПОУ       |
| US United States          | `us/ein`           | EIN          |
|                           | `us/itin`          | ITIN         |
|                           | `us/rtn`           | RTN          |
|                           | `us/ssn`           | SSN          |
| UY Uruguay                | `uy/rut`           | RUT          |
| VE Venezuela              | `ve/rif`           | RIF          |
| VN Vietnam                | `vn/mst`           | MST          |
| ZA South Africa           | `za/idnr`          | SA ID        |

</details>

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
bun test         # 4,185 tests
bun run lint     # oxlint
bun run format   # oxfmt
```

## License

[MIT](./LICENSE)
