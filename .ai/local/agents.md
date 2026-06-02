## Repository Specifics

`@stll/stdnum` validates, compacts, and formats standard identifiers across many jurisdictions. Correctness, international coverage, and stable exports are the core product surface.

### Commands

- `bun install`
- `bun run lint`
- `bun run format:check`
- `bun run typecheck`
- `bun test`
- `bun run oracle`
- `bun run sync-exports:check`

### Working Rules

- Preserve per-country module boundaries and export paths; package exports are public API.
- Use property and mutation tests for checksum behavior when the input space is large.
- Treat external oracle packages as comparison probes, not unquestioned truth.
- Keep examples valid, minimal, and jurisdiction-specific.
- Avoid English-only assumptions in names, aliases, formatting, and identifier metadata.
