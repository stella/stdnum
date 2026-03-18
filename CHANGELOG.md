# Changelog

All notable changes to this project will be
documented in this file.

The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-18

### Added

- Initial release.
- Czech identifiers: IČO, DIČ, RČ (birth number).
- Slovak identifiers: RČ, IČ DPH (VAT).
- German identifiers: USt-IdNr. (VAT), IdNr
  (personal tax ID).
- International: IBAN, credit card (Luhn), LEI.
- Shared checksum algorithms: Luhn, mod-97,
  weighted sum, ISO 7064 Mod 11,10.
- Unicode normalization utility for OCR/PDF
  artifacts.
- Per-identifier entry points for tree-shaking.

[0.1.0]: https://github.com/stella/stdnum/releases/tag/v0.1.0
