## Repository Specifics

`@stll/stdnum` validates, compacts, and formats standard identifiers across many jurisdictions. Correctness, international coverage, and stable exports are the core product surface.

### Commands

- `bun install`
- `bun run lint`
- `bun run format:check`
- `bun run typecheck`
- `bun test`
- `bun run oracle`
- `bun run codegen:check`

### Working Rules

- Preserve per-country module boundaries and export paths; package exports are public API.
- Use property and mutation tests for checksum behavior when the input space is large.
- Treat external oracle packages as comparison probes, not unquestioned truth.
- Keep examples valid, minimal, and jurisdiction-specific.
- Avoid English-only assumptions in names, aliases, formatting, and identifier metadata.

### Validation Performance Architecture

- Treat canonical ASCII validation as a zero-allocation contract. Register a
  `CanonicalValidation` kernel and add an allocation-counting test whenever a
  validator is on a supported hot path.
- Validate canonical identifiers directly from bytes in one pass. Do not build
  temporary `String`, `Vec`, digit collection, regex match, or diagnostic object
  in a checksum kernel.
- Keep the Unicode-aware normalizer as the compatibility fallback. Canonical
  kernels must return `NotCanonical` whenever normalization would change input;
  never narrow accepted formatted or international input to accelerate ASCII.
- Separate validation status from presentation. Core kernels return compact
  status and typed error codes; bindings construct strings, objects, exceptions,
  and human-readable diagnostics only when their public contract needs them.
- Specialize checksum algorithms while keeping registry dispatch, metadata,
  fixtures, bindings, and generated public surfaces generic.
- Differentially test every specialized canonical kernel against the full
  validator. Use valid-by-construction inputs and targeted invalid mutations to
  exercise every jurisdiction and algorithm branch, not only example fixtures.
- Derive duplicated declarative metadata from one source of truth where
  practical. Otherwise exhaustively assert its consistency across every entry.
- Keep binding calls coarse. Prefer indexed dispatch and batch operations so
  Node and Python callers can amortize FFI crossings.
- Treat performance as a tested product contract. Require deterministic
  allocation assertions for hot kernels and controlled, normalized oracle
  benchmarks for throughput; do not use noisy wall-clock checks as unit tests.
- Do not add `unsafe` for speculative speedups. Require a measured material gain,
  a small isolated boundary, equivalence tests, and fuzz coverage before making
  an exception to the workspace default.
