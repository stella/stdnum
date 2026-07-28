use std::{
  env,
  error::Error,
  fmt::Write as _,
  fs,
  io::{Error as IoError, ErrorKind},
  path::Path,
};

const BANK_CODE_SOURCE: &str = "src/validators/cz/bank_codes.txt";

fn invalid_data(message: &str) -> IoError {
  IoError::new(ErrorKind::InvalidData, message)
}

fn main() -> Result<(), Box<dyn Error>> {
  let manifest_dir = env::var("CARGO_MANIFEST_DIR")?;
  let source =
    fs::read_to_string(Path::new(&manifest_dir).join(BANK_CODE_SOURCE))?;
  let mut codes = Vec::new();
  for line in source.lines() {
    let code = line.trim();
    if code.is_empty() || code.starts_with('#') {
      continue;
    }
    if code.len() != 4 || !code.bytes().all(|byte| byte.is_ascii_digit()) {
      return Err(
        invalid_data("Czech bank codes must be four ASCII digits").into(),
      );
    }
    let code = code.parse::<u16>()?;
    if codes.last().is_some_and(|previous| *previous >= code) {
      return Err(
        invalid_data("Czech bank codes must be sorted and unique").into(),
      );
    }
    codes.push(code);
  }
  if codes.is_empty() {
    return Err(
      invalid_data("Czech bank code directory must not be empty").into(),
    );
  }

  let mut generated = String::from("&[\n");
  for code in codes {
    writeln!(generated, "  {code},")?;
  }
  generated.push_str("]\n");

  let output_dir = env::var("OUT_DIR")?;
  fs::write(Path::new(&output_dir).join("cz_bank_codes.rs"), generated)?;
  Ok(())
}
