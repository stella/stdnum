use crate::{
  compact_without, is_ascii_digits, random_below, random_digits,
  types::{
    CountryCode, EntityType, ValidationError, ValidationResult, Validator,
    ValidatorScope, ValidatorSpec,
  },
};

const PREFIXES: &[&str] = &[
  "01", "02", "03", "04", "05", "06", "10", "11", "12", "13", "14", "15", "16",
  "20", "21", "22", "23", "24", "25", "26", "27", "30", "31", "32", "33", "34",
  "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47",
  "48", "50", "51", "52", "53", "54", "55", "56", "57", "58", "59", "60", "61",
  "62", "63", "64", "65", "66", "67", "68", "71", "72", "73", "74", "75", "76",
  "77", "80", "81", "82", "83", "84", "85", "86", "87", "88", "90", "91", "92",
  "93", "94", "95", "98", "99",
];

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "us.ein",
  name: "Employer Identification Number",
  local_name: "Employer Identification Number",
  abbreviation: "EIN",
  aliases: &["EIN", "Employer Identification Number", "Federal Tax ID"],
  candidate_pattern: r"\d{2}-?\d{7}",
  scope: ValidatorScope::Country(CountryCode::Us),
  entity_type: EntityType::Company,
  source_url: Some(
    "https://www.irs.gov/businesses/small-businesses-self-employed/how-eins-are-assigned-and-valid-ein-prefixes",
  ),
  lengths: &[],
  examples: &["042103594"],
  compact,
  format,
  validate,
  generate: Some(generate),
  parse: None,
});

#[must_use]
pub fn compact(value: &str) -> String {
  compact_without(value, &[' ', '-'])
}

#[must_use]
pub fn format(value: &str) -> String {
  let compact = compact(value);
  if compact.len() != 9 {
    return compact;
  }
  format!(
    "{}-{}",
    compact.get(..2).unwrap_or(""),
    compact.get(2..).unwrap_or("")
  )
}

pub fn validate(value: &str) -> ValidationResult {
  let compact = compact(value);
  if !is_ascii_digits(&compact) {
    return Err(ValidationError::InvalidFormat(
      "EIN must contain only digits",
    ));
  }
  if compact.len() != 9 {
    return Err(ValidationError::InvalidLength("EIN must be 9 digits"));
  }
  if !compact
    .get(..2)
    .is_some_and(|prefix| PREFIXES.contains(&prefix))
  {
    return Err(ValidationError::InvalidComponent(
      "EIN campus prefix is invalid",
    ));
  }
  Ok(compact)
}

#[must_use]
pub fn generate() -> String {
  let prefix = PREFIXES
    .get(random_below(PREFIXES.len()))
    .copied()
    .unwrap_or("01");
  format!("{prefix}{}", random_digits(7))
}
