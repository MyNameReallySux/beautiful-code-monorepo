# @beautiful-code/string-utils

## 0.3.0

### Minor Changes

- Modern TypeScript rewrite (ESM + CJS, strict types). Public API unchanged:
  `StringUtils`, `StringStream`, and the named exports (`contains`, `capitalize`,
  `toCamelCase`, `toKebabCase`, `toSnakeCase`, `toReadable`, `toWordArray`,
  `stream`) behave identically — the original test suite passes unmodified.
  Deprecated `.substr()` replaced with `.slice()` internally. Now requires
  Node >= 20.

### Patch Changes

- Updated dependencies
  - @beautiful-code/type-utils@0.2.0
