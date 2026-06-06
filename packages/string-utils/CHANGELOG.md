# @beautiful-code/string-utils

## 1.0.0

### Major Changes

- 3577278: Modern TypeScript rewrite (ESM + CJS, strict types). Public API unchanged:
  `StringUtils`, `StringStream`, and the named exports (`contains`, `capitalize`,
  `toCamelCase`, `toKebabCase`, `toSnakeCase`, `toReadable`, `toWordArray`,
  `stream`) behave identically — the original test suite passes unmodified.
  Deprecated `.substr()` replaced with `.slice()` internally. Now requires
  Node >= 20.

### Patch Changes

- Updated dependencies [3577278]
  - @beautiful-code/type-utils@1.0.0
