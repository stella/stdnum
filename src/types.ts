/**
 * ISO 3166-1 alpha-2 country codes for countries
 * with at least one validator in this package.
 */
export type CountryCode =
  | "AT"
  | "AU"
  | "BE"
  | "BG"
  | "BR"
  | "CA"
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
  | "SK"
  | "TR"
  | "US";

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

/**
 * Structured data extracted from a personal ID number.
 * Returned by `parse()` on validators that encode
 * birth date and gender.
 */
export type ParsedPersonId = {
  birthDate: Date;
  gender: "male" | "female";
};

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

  /** One-liner describing the identifier. */
  description?: string;
  /** URL to official authority or spec page. */
  sourceUrl?: string;
  /** Valid lengths of the compact form. */
  lengths?: readonly number[];

  /**
   * Known-valid compact values. Useful as test
   * seeds, form placeholders, API schema examples,
   * and documentation. Sourced from official
   * government specs where available.
   */
  examples?: readonly string[];

  /**
   * Generate a random valid identifier in compact
   * form. Available on validators with checksum
   * algorithms. Useful for testing, demos, and
   * form placeholders. NOT cryptographically secure.
   */
  generate?: () => string;
};
