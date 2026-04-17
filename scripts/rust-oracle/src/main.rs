use std::io::{self, Read};
use std::str::FromStr;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 2 {
        eprintln!("Usage: stdnum-oracle <format>");
        std::process::exit(1);
    }
    let format = &args[1];

    let mut input = String::new();
    io::stdin().read_to_string(&mut input).unwrap();
    let values: Vec<String> =
        serde_json::from_str(&input).unwrap();

    for value in &values {
        let valid = match format.as_str() {
            "iban" => iban::Iban::from_str(value).is_ok(),
            "luhn" => luhn::valid(value),
            _ => {
                eprintln!("Unknown format: {format}");
                std::process::exit(1);
            }
        };
        println!("{}", if valid { "1" } else { "0" });
    }
}
