/**
 * ISO 3166-1 alpha-2 country codes for countries
 * with at least one validator in this package.
 */
export type CountryCode =
  | "AT"
  | "BE"
  | "BG"
  | "CH"
  | "CY"
  | "CZ"
  | "DE"
  | "DK"
  | "EE"
  | "ES"
  | "FI"
  | "FR"
  | "GB"
  | "GR"
  | "HR"
  | "HU"
  | "IE"
  | "IS"
  | "IT"
  | "LT"
  | "LU"
  | "LV"
  | "MT"
  | "NL"
  | "NO"
  | "PL"
  | "PT"
  | "RO"
  | "SE"
  | "SI"
  | "SK";

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

export type Validator = {
  /** English name. */
  name: string;
  /** Name in the local language. */
  localName: string;
  /** Common abbreviation (e.g. "IČO"). */
  abbreviation: string;
  /** Country this identifier belongs to. */
  country?: CountryCode;
  /** What kind of entity this identifies. */
  entityType: "person" | "company" | "any";

  /**
   * Strip separators and normalize to a
   * canonical compact form.
   */
  compact: (value: string) => string;

  /**
   * Format the identifier for display
   * (e.g. add separators, group digits).
   */
  format: (value: string) => string;

  /**
   * Validate the identifier. Returns the
   * compact form on success, or an error
   * with a code and message on failure.
   */
  validate: (value: string) => ValidateResult;
};
