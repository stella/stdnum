---
"@stll/stdnum": patch
---

Resolve the host platform's native binding through literal `require` specifiers in `index.cjs`, so bundlers (Bun `--compile`, esbuild) embed the addon as a sidecar instead of failing on first use inside a bundle.
