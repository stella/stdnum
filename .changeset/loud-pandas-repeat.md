---
"@stll/stdnum": patch
---

Say which package is missing when the native binding cannot load. The platform
binaries are optional dependencies, so an installer that declines them leaves
the package importable and dead, throwing only on first use. The previous error
listed every supported target, including the one it was running on, which reads
as a portability problem rather than a missing install.
