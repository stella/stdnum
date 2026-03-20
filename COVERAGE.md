# Complete Identifier Coverage Matrix

## Libraries tracked

| Key   | Library                | Language   | License | Countries        | Modules  | Oracle                    |
|-------|------------------------|------------|---------|------------------|----------|---------------------------|
| py    | python-stdnum          | Python     | LGPL    | 67               | ~315     | Gold standard             |
| idn   | identique/idnumbers    | Python     | MIT     | 77               | ~80      | Python oracle             |
| js    | stdnum-js              | TypeScript | MIT     | 93               | ~235     | JS oracle                 |
| jsvat | jsvat                  | TypeScript | MIT     | EU+UK+CH+NO      | ~30      | JS oracle                 |
| vp    | validate-polish        | TypeScript | MIT     | PL               | 3        | JS oracle                 |
| it    | ibantools              | TypeScript | MIT     | Intl             | 1        | JS oracle                 |
| ib    | iban.js                | JavaScript | ISC     | Intl             | 1        | JS oracle                 |
| lu    | luhn / fast-luhn       | JavaScript | MIT     | Intl             | 1        | JS oracle                 |
| php   | loophp/tin             | PHP        | MIT     | EU-27            | 27       | PHP oracle                |
| rb    | social_security_number | Ruby       | MIT     | ~20              | ~25      | Ruby oracle               |
| vv    | valvat                 | Ruby       | MIT     | EU+UK            | ~30      | Ruby oracle               |
| rs    | tax-ids                | Rust       | MIT     | EU+UK+CH+NO      | ~30      | Covered by jsvat/valvat   |
| net   | CountryValidator       | C#/.NET    | MIT     | ~60              | ~120     | Reference (no runtime)    |
| tid   | Tax ID Pro             | API        | Paid    | 100+             | 200+     | Reference (paid API)      |
| stll  | @stll/stdnum           | TypeScript | MIT     | 34               | 83       | All of the above          |

## Coverage by country

| CC | Identifier   | py | js | net | php | rb | rs | jsvat | tid | stll |
|----|--------------|----|----|-----|-----|----|----|-------|-----|------|
| AD | NRT          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| AL | NIPT         | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| AR | CUIT         | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| AR | DNI          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| AR | CBU          | ✅ | ✅ | —   | —   | —  | —  | —     | —   | ❌   |
| AT | UID (VAT)    | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| AT | Firmenbuch   | ✅ | ✅ | ✅  | —   | —  | —  | —     | —   | ✅   |
| AT | TIN          | ✅ | ✅ | ✅  | ✅  | —  | —  | —     | ✅  | ❌   |
| AT | VNR (SSN)    | ✅ | ✅ | ✅  | —   | —  | —  | —     | —   | ❌   |
| AU | ABN          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| AU | ACN          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| AU | TFN          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| AZ | VOEN         | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| BE | VAT          | ✅ | ✅ | ✅  | ✅  | ✅ | —  | ✅    | ✅  | ✅   |
| BE | NN           | ✅ | ✅ | ✅  | ✅  | ✅ | —  | —     | ✅  | ✅   |
| BE | BIS          | ✅ | ✅ | —   | —   | —  | —  | —     | —   | ❌   |
| BG | VAT          | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| BG | EGN          | ✅ | ✅ | ✅  | ✅  | —  | —  | —     | ✅  | ✅   |
| BG | PNF          | ✅ | ✅ | —   | —   | —  | —  | —     | —   | ❌   |
| BR | CPF          | ✅ | ✅ | ✅  | —   | —  | —  | ✅    | ✅  | ✅   |
| BR | CNPJ         | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| BY | UNP          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| CA | SIN          | ✅ | ✅ | ✅  | —   | ✅ | —  | —     | ✅  | ✅   |
| CA | BN           | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| CH | UID          | ✅ | ✅ | ✅  | —   | ✅ | ✅ | ✅    | ✅  | ✅   |
| CH | VAT          | ✅ | ✅ | ✅  | —   | —  | ✅ | ✅    | ✅  | ✅   |
| CH | SSN/AHV      | ✅ | ✅ | ✅  | —   | ✅ | —  | —     | ✅  | ✅   |
| CL | RUT          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| CN | RIC          | ✅ | ✅ | ✅  | —   | ✅ | —  | —     | ✅  | ❌   |
| CN | USCC         | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| CO | NIT          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| CR | CPF/CPJ      | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| CU | NI           | ✅ | ✅ | ✅  | —   | —  | —  | —     | —   | ❌   |
| CY | VAT          | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| CZ | ICO          | —  | —  | ✅  | ✅  | ✅ | —  | ✅    | ✅  | ✅   |
| CZ | DIC          | ✅ | ✅ | ✅  | ✅  | ✅ | —  | ✅    | ✅  | ✅   |
| CZ | RC           | ✅ | ✅ | ✅  | ✅  | ✅ | —  | —     | ✅  | ✅   |
| DE | VAT          | ✅ | ✅ | ✅  | ✅  | ✅ | —  | ✅    | ✅  | ✅   |
| DE | IdNr         | ✅ | ✅ | ✅  | ✅  | ✅ | —  | —     | ✅  | ✅   |
| DE | Steuernr     | ✅ | ✅ | ✅  | ✅  | —  | —  | —     | ✅  | ❌   |
| DE | Handelsreg   | ✅ | —  | ✅  | —   | —  | —  | —     | —   | ❌   |
| DK | VAT/CVR      | ✅ | ✅ | ✅  | ✅  | ✅ | —  | ✅    | ✅  | ✅   |
| DK | CPR          | ✅ | ✅ | ✅  | ✅  | ✅ | —  | —     | ✅  | ✅   |
| DO | Cedula/RNC   | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| EC | CI/RUC       | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| EE | IK           | ✅ | ✅ | ✅  | ✅  | ✅ | —  | —     | ✅  | ✅   |
| EE | KMKR/VAT     | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| EE | Registrikood | ✅ | ✅ | —   | —   | —  | —  | —     | —   | ✅   |
| EG | TN           | ✅ | ✅ | —   | —   | —  | —  | —     | ✅  | ❌   |
| ES | VAT/NIF      | ✅ | ✅ | ✅  | ✅  | ✅ | —  | ✅    | ✅  | ✅   |
| ES | DNI          | ✅ | ✅ | ✅  | ✅  | ✅ | —  | —     | ✅  | ✅   |
| ES | NIE          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| ES | CIF          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| FI | VAT/ALV      | ✅ | ✅ | ✅  | ✅  | ✅ | —  | ✅    | ✅  | ✅   |
| FI | HETU         | ✅ | ✅ | ✅  | ✅  | ✅ | —  | —     | ✅  | ✅   |
| FI | Y-tunnus     | ✅ | ✅ | —   | —   | —  | —  | —     | —   | ✅   |
| FR | SIREN        | ✅ | ✅ | ✅  | ✅  | ✅ | —  | —     | ✅  | ✅   |
| FR | SIRET        | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| FR | TVA          | ✅ | ✅ | ✅  | ✅  | ✅ | —  | ✅    | ✅  | ✅   |
| FR | NIF          | ✅ | ✅ | ✅  | ✅  | ✅ | —  | —     | ✅  | ✅   |
| FR | NIR          | ✅ | ✅ | ✅  | —   | ✅ | —  | —     | ✅  | ❌   |
| GB | VAT          | ✅ | ✅ | ✅  | ✅  | ✅ | ✅ | ✅    | ✅  | ✅   |
| GB | UTR          | ✅ | ✅ | ✅  | —   | ✅ | —  | —     | ✅  | ✅   |
| GB | SEDOL        | ✅ | —  | —   | —   | —  | —  | —     | —   | ❌   |
| GR | VAT          | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| GR | AMKA         | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| HR | OIB          | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| HU | VAT          | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| ID | NPWP/NIK     | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| IE | VAT          | ✅ | ✅ | ✅  | ✅  | ✅ | —  | ✅    | ✅  | ✅   |
| IE | PPS          | ✅ | ✅ | ✅  | ✅  | ✅ | —  | —     | ✅  | ✅   |
| IL | ID/HP        | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| IN | Aadhaar      | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| IN | PAN          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| IN | GSTIN        | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| IS | Kennitala    | ✅ | ✅ | ✅  | —   | ✅ | —  | —     | ✅  | ✅   |
| IS | VSK          | ✅ | ✅ | —   | —   | —  | —  | —     | —   | ✅   |
| IT | CF           | ✅ | ✅ | ✅  | ✅  | ✅ | —  | —     | ✅  | ✅   |
| IT | IVA          | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| JP | CN/IN        | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| KR | BRN/RRN      | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| LI | PEID         | ✅ | ✅ | —   | —   | —  | —  | —     | ✅  | ❌   |
| LT | Asmens       | ✅ | ✅ | ✅  | ✅  | ✅ | —  | —     | ✅  | ✅   |
| LT | PVM/VAT      | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| LU | TVA          | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| LV | PVN/VAT      | ✅ | ✅ | ✅  | ✅  | ✅ | —  | ✅    | ✅  | ✅   |
| MA | ICE          | ✅ | ✅ | —   | —   | —  | —  | —     | ✅  | ❌   |
| MC | TVA          | ✅ | ✅ | —   | —   | —  | —  | —     | —   | ❌   |
| MD | IDNO         | ✅ | ✅ | —   | —   | —  | —  | —     | ✅  | ❌   |
| ME | PIB          | ✅ | ✅ | —   | —   | —  | —  | —     | ✅  | ❌   |
| MK | EDB          | ✅ | ✅ | —   | —   | —  | —  | —     | ✅  | ❌   |
| MT | VAT          | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| MX | RFC/CURP     | ✅ | ✅ | ✅  | —   | ✅ | —  | —     | ✅  | ❌   |
| MY | NRIC         | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| NL | VAT          | ✅ | ✅ | ✅  | ✅  | ✅ | —  | ✅    | ✅  | ✅   |
| NL | BSN          | ✅ | ✅ | ✅  | ✅  | ✅ | —  | —     | ✅  | ✅   |
| NL | KvK          | —  | —  | —   | —   | —  | —  | —     | —   | ✅   |
| NO | Orgnr        | ✅ | ✅ | ✅  | —   | ✅ | ✅ | ✅    | ✅  | ✅   |
| NO | MVA          | ✅ | ✅ | —   | —   | —  | ✅ | ✅    | ✅  | ✅   |
| NO | Fodselsnr    | ✅ | ✅ | ✅  | —   | ✅ | —  | —     | ✅  | ✅   |
| NZ | IRD          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| PE | CUI/RUC      | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| PK | CNIC         | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| PL | NIP          | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| PL | PESEL        | ✅ | ✅ | ✅  | ✅  | —  | —  | —     | ✅  | ✅   |
| PL | REGON        | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| PT | NIF/VAT      | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| PT | CC           | ✅ | ✅ | —   | —   | —  | —  | —     | ✅  | ❌   |
| RO | VAT/CUI      | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| RO | CNP          | ✅ | ✅ | ✅  | ✅  | —  | —  | —     | ✅  | ✅   |
| RS | PIB          | ✅ | ✅ | ✅  | —   | —  | —  | ✅    | ✅  | ❌   |
| RU | INN          | ✅ | ✅ | ✅  | —   | —  | —  | ✅    | ✅  | ❌   |
| SE | VAT          | ✅ | ✅ | ✅  | ✅  | ✅ | —  | ✅    | ✅  | ✅   |
| SE | Personnummer | ✅ | ✅ | ✅  | ✅  | ✅ | —  | —     | ✅  | ✅   |
| SE | Orgnr        | ✅ | ✅ | —   | —   | —  | —  | —     | —   | ✅   |
| SG | UEN          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| SI | VAT/DDV      | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| SI | EMSO         | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| SK | VAT/DPH      | ✅ | ✅ | ✅  | ✅  | —  | —  | ✅    | ✅  | ✅   |
| SK | ICO          | —  | —  | ✅  | —   | —  | —  | —     | —   | ✅   |
| SK | RC           | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| TH | PIN/TIN      | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| TR | T.C. Kimlik  | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| TR | VKN          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| TW | UBN          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| UA | EDRPOU/RNTRC | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| US | SSN          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| US | EIN          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ✅   |
| US | ITIN         | ✅ | —  | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| US | RTN          | ✅ | —  | —   | —   | —  | —  | —     | —   | ❌   |
| UY | RUT          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| VE | RIF          | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |
| VN | MST          | ✅ | ✅ | —   | —   | —  | —  | —     | ✅  | ❌   |
| ZA | ID/TIN       | ✅ | ✅ | ✅  | —   | —  | —  | —     | ✅  | ❌   |

## Countries only in identique/idnumbers (not in python-stdnum)

| CC | Identifier   | idn | stll |
|----|--------------|-----|------|
| AE | Emirates ID  | ✅  | ❌   |
| AM | Personal Nr  | ✅  | ❌   |
| BA | JMBG         | ✅  | ❌   |
| BD | National ID  | ✅  | ❌   |
| BH | Personal Nr  | ✅  | ❌   |
| GE | Personal Nr  | ✅  | ❌   |
| HK | HKID         | ✅  | ❌   |
| IQ | National ID  | ✅  | ❌   |
| IR | National ID  | ✅  | ❌   |
| KW | Civil Nr     | ✅  | ❌   |
| KZ | IIN/BIN      | ✅  | ❌   |
| LK | NIC          | ✅  | ❌   |
| MO | ARC/NID      | ✅  | ❌   |
| NG | National ID  | ✅  | ❌   |
| NP | National ID  | ✅  | ❌   |
| PG | National ID  | ✅  | ❌   |
| PH | PhilID       | ✅  | ❌   |
| ZW | National ID  | ✅  | ❌   |

## Identifiers only in stdnum-js (not in python-stdnum)

| CC | Identifier   | js  | stll |
|----|--------------|-----|------|
| AI | TIN          | ✅  | ❌   |
| BZ | TIN          | ✅  | ❌   |
| CA | GST/PST/QST  | ✅  | ❌   |
| DE | SVNR/Passport| ✅  | ❌   |
| ES | NSS          | ✅  | ❌   |
| GB | NINO         | ✅  | ❌   |
| MX | CLABE        | ✅  | ❌   |

## International identifiers

| Identifier  | py | js | stll |
|-------------|----|----|------|
| BIC/SWIFT   | —  | —  | ✅   |
| IBAN        | ✅ | ✅ | ✅   |
| ISIN        | ✅ | ✅ | ✅   |
| LEI         | ✅ | ✅ | ✅   |
| Credit Card | ✅ | ✅ | ✅   |
| Luhn        | —  | —  | ✅   |
| EU VAT      | ✅ | ✅ | ✅   |

## Legend

- ✅ Implemented
- ❌ Not implemented
- — Not available in library
