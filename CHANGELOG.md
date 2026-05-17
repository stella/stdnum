# Changelog

All notable changes to this project will be
documented in this file.

The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-17

### Changed

- Bumped to 1.0.0 to opt out of the npm pinning quirk
  where `^0.0.1` resolves only to `0.0.1`. The public
  surface and feature set are unchanged from the
  pre-1.0 line.
- `Validator<T>` now exposes `parse?` on the base type
  with a widened `ParsedIdentifier | null` return.
  Producers that type as `Validator<ParsedPersonId>` or
  `Validator<ParsedBirthDate>` still narrow the return
  type as before.

### Fixed

- Treat `oxlint` as a real CI gate: the
  `no-non-null-assertion` rule was silently disabled in
  the lint config. It is now enforced; existing
  violations were resolved with structural narrowing
  (most weighted-sum loops now use array iterators) or
  documented `// SAFETY:` comments where the existence
  is genuinely guaranteed.
- `format:check` is now wired into CI so formatter
  drift cannot land unnoticed.

### Removed

- Dead `imports` map (`#checksums/*`, `#util/*`) from
  `package.json`. Consumers never hit it: built output
  uses relative imports and dev/test resolution goes
  through `tsconfig.json` `paths`.

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

[1.0.0]: https://github.com/stella/stdnum/releases/tag/v1.0.0
[0.1.0]: https://github.com/stella/stdnum/releases/tag/v0.1.0
