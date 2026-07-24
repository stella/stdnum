use crate::{
  BECH32_CHARSET, BECH32_CHECKSUM_LENGTH, BECH32_CONST, BECH32_GENERATORS,
  BECH32_MAX_DATA_LENGTH, BECH32_MIN_DATA_LENGTH, BECH32M_CONST,
  compact_without,
  types::{
    EntityType, ValidationError, ValidationResult, Validator, ValidatorScope,
    ValidatorSpec,
  },
};

const HRP_EXPANSION: &[u32] = &[3, 3, 0, 2, 3];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Bech32ErrorCode {
  Format,
  Checksum,
  Component,
}

pub static VALIDATOR: Validator = Validator::new(ValidatorSpec {
  id: "crypto.btcbech32",
  name: "Bitcoin Bech32 Address",
  local_name: "Bitcoin Bech32 Address",
  abbreviation: "BTC",
  aliases: &[
    "Bitcoin address",
    "Bitcoin SegWit address",
    "Bech32 address",
    "Bech32m address",
  ],
  candidate_pattern: r"(?:bc1[ac-hj-np-z02-9]{11,71}|BC1[AC-HJ-NP-Z02-9]{11,71})",
  scope: ValidatorScope::Global,
  entity_type: EntityType::Any,
  source_url: None,
  lengths: &[],
  examples: &[
    "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
    "bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3",
  ],
  compact,
  format,
  validate,
  generate: None,
  parse: None,
});

#[must_use]
pub fn compact(value: &str) -> String {
  compact_without(value, &[' ']).to_lowercase()
}

#[must_use]
pub fn format(value: &str) -> String {
  compact(value)
}

#[must_use]
pub fn polymod(values: &[u32]) -> u32 {
  let mut check = 1_u32;
  for value in values {
    let top = check >> 25;
    check = ((check & 0x01ff_ffff) << 5) ^ value;
    for (index, generator) in BECH32_GENERATORS.iter().enumerate() {
      let shift = u32::try_from(index).unwrap_or(0);
      if ((top >> shift) & 1) == 1 {
        check ^= generator;
      }
    }
  }
  check
}

#[must_use]
pub fn convert_bits(
  values: &[u32],
  from_bits: u32,
  to_bits: u32,
) -> Option<Vec<u32>> {
  if from_bits >= u32::BITS || to_bits >= u32::BITS {
    return None;
  }
  let mut accumulator = 0_u32;
  let mut bits = 0_u32;
  let max_value = (1_u32 << to_bits).saturating_sub(1);
  let mut result = Vec::new();
  for value in values {
    if *value >> from_bits != 0 {
      return None;
    }
    accumulator = (accumulator << from_bits) | value;
    bits = bits.saturating_add(from_bits);
    while bits >= to_bits {
      bits = bits.saturating_sub(to_bits);
      result.push((accumulator >> bits) & max_value);
    }
  }
  if bits >= from_bits
    || ((accumulator << (to_bits.saturating_sub(bits))) & max_value) != 0
  {
    return None;
  }
  Some(result)
}

pub fn validate_bech32(raw_value: &str) -> Result<(), Bech32ErrorCode> {
  let has_lower = raw_value.chars().any(|ch| ch.is_ascii_lowercase());
  let has_upper = raw_value.chars().any(|ch| ch.is_ascii_uppercase());
  if has_lower && has_upper {
    return Err(Bech32ErrorCode::Format);
  }
  let value = raw_value.to_lowercase();
  let Some(data) = value.strip_prefix("bc1") else {
    return Err(Bech32ErrorCode::Component);
  };
  if data.len() < BECH32_MIN_DATA_LENGTH || data.len() > BECH32_MAX_DATA_LENGTH
  {
    return Err(Bech32ErrorCode::Format);
  }
  let mut values = Vec::with_capacity(data.len());
  for ch in data.chars() {
    let Some(position) = BECH32_CHARSET.find(ch) else {
      return Err(Bech32ErrorCode::Format);
    };
    values.push(u32::try_from(position).unwrap_or(0));
  }
  let mut expanded = HRP_EXPANSION.to_vec();
  expanded.extend(values.iter().copied());
  let check = polymod(&expanded);
  let Some(version) = values.first().copied() else {
    return Err(Bech32ErrorCode::Component);
  };
  if version > 16 {
    return Err(Bech32ErrorCode::Component);
  }
  if (version == 0 && check != BECH32_CONST)
    || (version > 0 && check != BECH32M_CONST)
  {
    return Err(Bech32ErrorCode::Checksum);
  }
  let end = values.len().saturating_sub(BECH32_CHECKSUM_LENGTH);
  let Some(program_values) = values.get(1..end) else {
    return Err(Bech32ErrorCode::Component);
  };
  let Some(program) = convert_bits(program_values, 5, 8) else {
    return Err(Bech32ErrorCode::Component);
  };
  if !(2..=40).contains(&program.len())
    || (version == 0 && !matches!(program.len(), 20 | 32))
  {
    return Err(Bech32ErrorCode::Component);
  }
  Ok(())
}

pub fn validate(value: &str) -> ValidationResult {
  let compact = compact(value);
  let raw = compact_without(value, &[' ']);
  match validate_bech32(&raw) {
    Ok(()) => Ok(compact),
    Err(Bech32ErrorCode::Component) => Err(ValidationError::InvalidComponent(
      "Bitcoin Bech32 address has an unsupported component",
    )),
    Err(Bech32ErrorCode::Checksum) => Err(ValidationError::InvalidChecksum(
      "Bitcoin Bech32 address fails checksum validation",
    )),
    Err(Bech32ErrorCode::Format) => Err(ValidationError::InvalidFormat(
      "Bitcoin Bech32 address has an invalid format",
    )),
  }
}
