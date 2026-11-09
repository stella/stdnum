---
"@stll/stdnum": patch
---

The native binding loader attaches the platform package failure as the `cause` of the error it throws, and treats a loaded module as unknown until the binding contract check accepts it.
