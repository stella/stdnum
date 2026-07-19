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

## Cursor Cloud specific instructions

This is a pure TypeScript library (no dev server or long-running service). "Running"
it means importing a validator (e.g. `bun -e 'import ico from "./dist/cz/ico.js"; ...'`)
or running a CLI script (`bun run oracle`, `bun scripts/catalog.ts`,
`bun run sync-exports`). Bun is the toolchain; standard commands are listed above and
in `CONTRIBUTING.md`.

- Build caveat: run the build as `bun --bun run build`, not `bun run build`. Plain
  `bun run build` executes the `tsdown` bin under Node (via its `#!/usr/bin/env node`
  shebang), so tsdown's `auto` config loader cannot import `tsdown.config.ts` and
  fails with `Failed to import module "unrun"` (an uninstalled optional peer). The
  `--bun` flag forces the Bun runtime, letting tsdown load the TS config natively.
  CI passes with plain `bun run build` only because `oven-sh/setup-bun` runs it under
  Bun.
- `.ai/shared` is a git submodule needed only for `bun run sync-ai` /
  `bun run sync-ai:check`. Core work (`bun test`, `bun run lint`, `bun run typecheck`,
  `bun --bun run build`, `bun run oracle`) does not require it. If it is missing, run
  `git submodule update --init`.
- `bunfig.toml` sets a 5-day install quarantine (`minimumReleaseAge`); installs use the
  committed `bun.lock`, so this does not block `bun install`.
