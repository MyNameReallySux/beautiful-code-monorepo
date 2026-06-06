---
'@beautiful-code/string-utils': major
---

Modern TypeScript rewrite (ESM + CJS, strict types). Public API unchanged:
`StringUtils`, `StringStream`, and the named exports (`contains`, `capitalize`,
`toCamelCase`, `toKebabCase`, `toSnakeCase`, `toReadable`, `toWordArray`,
`stream`) behave identically — the original test suite passes unmodified.
Deprecated `.substr()` replaced with `.slice()` internally. Now requires
Node >= 20.
