//! Public types shared by validators and language bindings.

use regex::Regex;

/// Stable machine-readable validation error categories.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ValidationErrorCode {
  InvalidFormat,
  InvalidLength,
  InvalidChecksum,
  InvalidComponent,
}

impl ValidationErrorCode {
  /// Return the TypeScript-compatible error code.
  #[must_use]
  pub const fn as_str(self) -> &'static str {
    match self {
      Self::InvalidFormat => "INVALID_FORMAT",
      Self::InvalidLength => "INVALID_LENGTH",
      Self::InvalidChecksum => "INVALID_CHECKSUM",
      Self::InvalidComponent => "INVALID_COMPONENT",
    }
  }
}

/// A typed validation failure with a stable category and useful message.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum ValidationError {
  #[error("{0}")]
  InvalidFormat(&'static str),
  #[error("{0}")]
  InvalidLength(&'static str),
  #[error("{0}")]
  InvalidChecksum(&'static str),
  #[error("{0}")]
  InvalidComponent(&'static str),
}

impl ValidationError {
  /// Return the stable error category used by the TypeScript API.
  #[must_use]
  pub const fn code(&self) -> ValidationErrorCode {
    match self {
      Self::InvalidFormat(_) => ValidationErrorCode::InvalidFormat,
      Self::InvalidLength(_) => ValidationErrorCode::InvalidLength,
      Self::InvalidChecksum(_) => ValidationErrorCode::InvalidChecksum,
      Self::InvalidComponent(_) => ValidationErrorCode::InvalidComponent,
    }
  }

  /// Return the human-readable error message.
  #[must_use]
  pub const fn message(&self) -> &'static str {
    match self {
      Self::InvalidFormat(message)
      | Self::InvalidLength(message)
      | Self::InvalidChecksum(message)
      | Self::InvalidComponent(message) => message,
    }
  }
}

/// The compact identifier on success, or a typed failure.
pub type ValidationResult = Result<String, ValidationError>;

/// Allocation-free validation result for an input that may already be compact.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CanonicalValidation {
  /// Normalization would change the input, so the full validation path is needed.
  NotCanonical,
  /// The input is already compact and valid.
  Valid,
  /// The input is already compact but invalid.
  Invalid(ValidationError),
}

/// ISO 3166-1 alpha-2 codes represented by the validator catalog.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum CountryCode {
  Ad,
  Ae,
  Ai,
  Al,
  Am,
  Ar,
  At,
  Au,
  Az,
  Ba,
  Bd,
  Be,
  Bg,
  Bh,
  Br,
  By,
  Bz,
  Ca,
  Ch,
  Cl,
  Cn,
  Co,
  Cr,
  Cu,
  Cy,
  Cz,
  De,
  Dk,
  Do,
  Ec,
  Ee,
  Eg,
  Es,
  Fi,
  Fr,
  Gb,
  Ge,
  Gh,
  Gr,
  Gt,
  Hk,
  Hr,
  Hu,
  Id,
  Ie,
  Il,
  In,
  Iq,
  Ir,
  Is,
  It,
  Jp,
  Kr,
  Kw,
  Kz,
  Li,
  Lk,
  Lt,
  Lu,
  Lv,
  Ma,
  Mc,
  Md,
  Me,
  Mk,
  Mt,
  Mu,
  Mx,
  My,
  Ng,
  Ni,
  Nl,
  No,
  Nz,
  Pa,
  Pe,
  Ph,
  Pk,
  Pl,
  Pt,
  Ro,
  Rs,
  Ru,
  Se,
  Sg,
  Si,
  Sk,
  Th,
  Tr,
  Tw,
  Ua,
  Us,
  Uy,
  Ve,
  Vn,
  Za,
}

impl CountryCode {
  #[must_use]
  pub const fn as_str(self) -> &'static str {
    match self {
      Self::Ad => "AD",
      Self::Ae => "AE",
      Self::Ai => "AI",
      Self::Al => "AL",
      Self::Am => "AM",
      Self::Ar => "AR",
      Self::At => "AT",
      Self::Au => "AU",
      Self::Az => "AZ",
      Self::Ba => "BA",
      Self::Bd => "BD",
      Self::Be => "BE",
      Self::Bg => "BG",
      Self::Bh => "BH",
      Self::Br => "BR",
      Self::By => "BY",
      Self::Bz => "BZ",
      Self::Ca => "CA",
      Self::Ch => "CH",
      Self::Cl => "CL",
      Self::Cn => "CN",
      Self::Co => "CO",
      Self::Cr => "CR",
      Self::Cu => "CU",
      Self::Cy => "CY",
      Self::Cz => "CZ",
      Self::De => "DE",
      Self::Dk => "DK",
      Self::Do => "DO",
      Self::Ec => "EC",
      Self::Ee => "EE",
      Self::Eg => "EG",
      Self::Es => "ES",
      Self::Fi => "FI",
      Self::Fr => "FR",
      Self::Gb => "GB",
      Self::Ge => "GE",
      Self::Gh => "GH",
      Self::Gr => "GR",
      Self::Gt => "GT",
      Self::Hk => "HK",
      Self::Hr => "HR",
      Self::Hu => "HU",
      Self::Id => "ID",
      Self::Ie => "IE",
      Self::Il => "IL",
      Self::In => "IN",
      Self::Iq => "IQ",
      Self::Ir => "IR",
      Self::Is => "IS",
      Self::It => "IT",
      Self::Jp => "JP",
      Self::Kr => "KR",
      Self::Kw => "KW",
      Self::Kz => "KZ",
      Self::Li => "LI",
      Self::Lk => "LK",
      Self::Lt => "LT",
      Self::Lu => "LU",
      Self::Lv => "LV",
      Self::Ma => "MA",
      Self::Mc => "MC",
      Self::Md => "MD",
      Self::Me => "ME",
      Self::Mk => "MK",
      Self::Mt => "MT",
      Self::Mu => "MU",
      Self::Mx => "MX",
      Self::My => "MY",
      Self::Ng => "NG",
      Self::Ni => "NI",
      Self::Nl => "NL",
      Self::No => "NO",
      Self::Nz => "NZ",
      Self::Pa => "PA",
      Self::Pe => "PE",
      Self::Ph => "PH",
      Self::Pk => "PK",
      Self::Pl => "PL",
      Self::Pt => "PT",
      Self::Ro => "RO",
      Self::Rs => "RS",
      Self::Ru => "RU",
      Self::Se => "SE",
      Self::Sg => "SG",
      Self::Si => "SI",
      Self::Sk => "SK",
      Self::Th => "TH",
      Self::Tr => "TR",
      Self::Tw => "TW",
      Self::Ua => "UA",
      Self::Us => "US",
      Self::Uy => "UY",
      Self::Ve => "VE",
      Self::Vn => "VN",
      Self::Za => "ZA",
    }
  }
}

/// Calendar date encoded in an identifier.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct IsoDate {
  pub year: i32,
  pub month: u8,
  pub day: u8,
}

/// Gender encoded by personal identifiers that expose it.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Gender {
  Male,
  Female,
}

/// Structured information extracted from a valid personal identifier.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ParsedIdentifier {
  pub birth_date: IsoDate,
  pub gender: Option<Gender>,
}

/// Whether an identifier belongs to a jurisdiction or is global.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ValidatorScope {
  Country(CountryCode),
  Global,
}

/// The kind of entity identified by a standard number.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EntityType {
  Person,
  Company,
  Any,
}

/// Module-owned validator behavior and metadata.
#[derive(Debug)]
pub struct Validator {
  id: &'static str,
  name: &'static str,
  local_name: &'static str,
  abbreviation: &'static str,
  aliases: &'static [&'static str],
  candidate_pattern: &'static str,
  scope: ValidatorScope,
  entity_type: EntityType,
  source_url: Option<&'static str>,
  lengths: &'static [usize],
  examples: &'static [&'static str],
  compact: fn(&str) -> String,
  format: fn(&str) -> String,
  validate: fn(&str) -> ValidationResult,
  validate_canonical: Option<fn(&str) -> CanonicalValidation>,
  generate: Option<fn() -> String>,
  parse: Option<fn(&str) -> Option<ParsedIdentifier>>,
}

/// Construction arguments for a [`Validator`].
#[derive(Clone, Copy)]
pub struct ValidatorSpec {
  pub id: &'static str,
  pub name: &'static str,
  pub local_name: &'static str,
  pub abbreviation: &'static str,
  pub aliases: &'static [&'static str],
  pub candidate_pattern: &'static str,
  pub scope: ValidatorScope,
  pub entity_type: EntityType,
  pub source_url: Option<&'static str>,
  pub lengths: &'static [usize],
  pub examples: &'static [&'static str],
  pub compact: fn(&str) -> String,
  pub format: fn(&str) -> String,
  pub validate: fn(&str) -> ValidationResult,
  pub generate: Option<fn() -> String>,
  pub parse: Option<fn(&str) -> Option<ParsedIdentifier>>,
}

impl Validator {
  #[must_use]
  pub const fn new(spec: ValidatorSpec) -> Self {
    Self {
      id: spec.id,
      name: spec.name,
      local_name: spec.local_name,
      abbreviation: spec.abbreviation,
      aliases: spec.aliases,
      candidate_pattern: spec.candidate_pattern,
      scope: spec.scope,
      entity_type: spec.entity_type,
      source_url: spec.source_url,
      lengths: spec.lengths,
      examples: spec.examples,
      compact: spec.compact,
      format: spec.format,
      validate: spec.validate,
      validate_canonical: None,
      generate: spec.generate,
      parse: spec.parse,
    }
  }

  /// Attach an allocation-free kernel for inputs that are already compact.
  #[must_use]
  pub const fn with_canonical_validator(
    mut self,
    validate: fn(&str) -> CanonicalValidation,
  ) -> Self {
    self.validate_canonical = Some(validate);
    self
  }

  #[must_use]
  pub const fn id(&self) -> &'static str {
    self.id
  }

  pub(crate) const fn validation_function(
    &self,
  ) -> fn(&str) -> ValidationResult {
    self.validate
  }

  #[must_use]
  pub const fn name(&self) -> &'static str {
    self.name
  }

  #[must_use]
  pub const fn local_name(&self) -> &'static str {
    self.local_name
  }

  #[must_use]
  pub const fn abbreviation(&self) -> &'static str {
    self.abbreviation
  }

  #[must_use]
  pub fn description(&self) -> Option<&'static str> {
    crate::catalog::description(self.id)
  }

  #[must_use]
  pub const fn aliases(&self) -> &'static [&'static str] {
    self.aliases
  }

  #[must_use]
  pub const fn candidate_pattern(&self) -> &'static str {
    self.candidate_pattern
  }

  #[must_use]
  pub const fn scope(&self) -> ValidatorScope {
    self.scope
  }

  #[must_use]
  pub const fn entity_type(&self) -> EntityType {
    self.entity_type
  }

  #[must_use]
  pub const fn source_url(&self) -> Option<&'static str> {
    self.source_url
  }

  #[must_use]
  pub const fn lengths(&self) -> &'static [usize] {
    self.lengths
  }

  #[must_use]
  pub const fn examples(&self) -> &'static [&'static str] {
    self.examples
  }

  #[must_use]
  pub fn compact(&self, value: &str) -> String {
    (self.compact)(value)
  }

  #[must_use]
  pub fn format(&self, value: &str) -> String {
    (self.format)(value)
  }

  pub fn validate(&self, value: &str) -> ValidationResult {
    (self.validate)(value)
  }

  /// Validate without allocating when a validator recognizes compact input.
  #[must_use]
  pub fn validate_canonical(&self, value: &str) -> CanonicalValidation {
    self
      .validate_canonical
      .map_or(CanonicalValidation::NotCanonical, |validate| {
        validate(value)
      })
  }

  /// Report whether this validator has an allocation-free canonical kernel.
  #[must_use]
  pub const fn supports_canonical_validation(&self) -> bool {
    self.validate_canonical.is_some()
  }

  #[must_use]
  pub fn is_valid(&self, value: &str) -> bool {
    match self.validate_canonical(value) {
      CanonicalValidation::Valid => true,
      CanonicalValidation::Invalid(_) => false,
      CanonicalValidation::NotCanonical => self.validate(value).is_ok(),
    }
  }

  #[must_use]
  pub const fn can_generate(&self) -> bool {
    self.generate.is_some()
  }

  #[must_use]
  pub fn generate(&self) -> Option<String> {
    self.generate.map(|generate| generate())
  }

  #[must_use]
  pub const fn can_parse(&self) -> bool {
    self.parse.is_some()
  }

  #[must_use]
  pub fn parse(&self, value: &str) -> Option<ParsedIdentifier> {
    self.parse.and_then(|parse| parse(value))
  }

  /// Compile the module-owned candidate pattern for text discovery.
  pub fn to_regex(&self) -> Result<Regex, regex::Error> {
    Regex::new(self.candidate_pattern)
  }
}
