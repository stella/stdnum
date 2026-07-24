export type CountryCode =
  | "AD"
  | "AE"
  | "AI"
  | "AL"
  | "AM"
  | "AR"
  | "AT"
  | "AU"
  | "AZ"
  | "BA"
  | "BD"
  | "BE"
  | "BG"
  | "BH"
  | "BR"
  | "BY"
  | "BZ"
  | "CA"
  | "CH"
  | "CL"
  | "CN"
  | "CO"
  | "CR"
  | "CU"
  | "CY"
  | "CZ"
  | "DE"
  | "DK"
  | "DO"
  | "EC"
  | "EE"
  | "EG"
  | "ES"
  | "FI"
  | "FR"
  | "GB"
  | "GE"
  | "GH"
  | "GR"
  | "GT"
  | "HK"
  | "HR"
  | "HU"
  | "ID"
  | "IE"
  | "IL"
  | "IN"
  | "IQ"
  | "IR"
  | "IS"
  | "IT"
  | "JP"
  | "KR"
  | "KW"
  | "KZ"
  | "LI"
  | "LK"
  | "LT"
  | "LU"
  | "LV"
  | "MA"
  | "MC"
  | "MD"
  | "ME"
  | "MK"
  | "MT"
  | "MU"
  | "MX"
  | "MY"
  | "NG"
  | "NI"
  | "NL"
  | "NO"
  | "NZ"
  | "PA"
  | "PE"
  | "PH"
  | "PK"
  | "PL"
  | "PT"
  | "RO"
  | "RS"
  | "RU"
  | "SE"
  | "SG"
  | "SI"
  | "SK"
  | "TH"
  | "TR"
  | "TW"
  | "UA"
  | "US"
  | "UY"
  | "VE"
  | "VN"
  | "ZA";

export type ErrorCode =
  | "INVALID_FORMAT"
  | "INVALID_LENGTH"
  | "INVALID_CHECKSUM"
  | "INVALID_COMPONENT";

export type StdnumError = {
  code: ErrorCode;
  message: string;
};
export type ValidateResult =
  | { valid: true; compact: string }
  | { valid: false; error: StdnumError };
export type ParsedBirthDate = { birthDate: Date };
export type ParsedPersonId = ParsedBirthDate & {
  gender: "male" | "female";
};
export type ParsedIdentifier =
  | ParsedBirthDate
  | ParsedPersonId;
export type CardNetwork =
  | "visa"
  | "mastercard"
  | "amex"
  | "discover"
  | "diners"
  | "jcb"
  | "unionpay"
  | "maestro";

type ValidatorBase<
  TParsed extends ParsedIdentifier | undefined = undefined,
> = {
  name: string;
  localName: string;
  abbreviation: string;
  entityType: "person" | "company" | "any";
  compact: (value: string) => string;
  format: (value: string) => string;
  validate: (value: string) => ValidateResult;
  description?: string;
  sourceUrl?: string;
  lengths?: readonly number[];
  examples?: readonly string[];
  generate?: () => string;
  aliases?: readonly string[];
  candidatePattern?: string;
  parse?: (value: string) => ParsedIdentifier | null;
} & ([TParsed] extends [undefined]
  ? unknown
  : { parse: (value: string) => TParsed | null });

export type CountryValidator<
  TCountry extends CountryCode = CountryCode,
  TParsed extends ParsedIdentifier | undefined = undefined,
> = ValidatorBase<TParsed> & {
  scope: "country";
  country: TCountry;
};
export type GlobalValidator<
  TParsed extends ParsedIdentifier | undefined = undefined,
> = ValidatorBase<TParsed> & { scope: "global" };
export type Validator<
  TParsed extends ParsedIdentifier | undefined = undefined,
> =
  | CountryValidator<CountryCode, TParsed>
  | GlobalValidator<TParsed>;
export type ParsableValidator<
  TParsed extends ParsedIdentifier = ParsedIdentifier,
> = Validator<TParsed>;
export type ValidatorScope =
  | { scope: "country"; country: CountryCode }
  | { scope: "global" };
