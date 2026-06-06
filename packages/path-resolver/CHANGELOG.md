# @beautiful-code/path-resolver

## 1.0.0

### Major Changes

- 3577278: Modern TypeScript rewrite (ESM + CJS, strict types, typed directory-map and
  options interfaces). The embedded `ConsoleUtils` copy is replaced by a real
  dependency on `@beautiful-code/console-utils`.

  Breaking/behavior changes vs 0.x:
  - `_validateOptions` no longer assigns `rootPath` into `resolverPrefix`
    (0.x copy-paste bug) — custom `resolverPrefix` options now work.
  - Internal `isDirectoryURI` helper (which called `path.split` on the node
    module instead of the argument) removed; it was dead code.
  - Errors are exported from a single `errors` module
    (`DuplicateKeyError`, `InvalidArgumentsError`).

### Patch Changes

- Updated dependencies [3577278]
- Updated dependencies [3577278]
- Updated dependencies [3577278]
  - @beautiful-code/console-utils@1.0.0
  - @beautiful-code/string-utils@1.0.0
  - @beautiful-code/type-utils@1.0.0
