---
'@beautiful-code/path-resolver': major
---

Modern TypeScript rewrite (ESM + CJS, strict types, typed directory-map and
options interfaces). The embedded `ConsoleUtils` copy is replaced by a real
dependency on `@beautiful-code/console-utils`.

Breaking/behavior changes vs 0.x:

- `_validateOptions` no longer assigns `rootPath` into `resolverPrefix`
  (0.x copy-paste bug) — custom `resolverPrefix` options now work.
- Internal `isDirectoryURI` helper (which called `path.split` on the node
  module instead of the argument) removed; it was dead code.
- Errors are exported from a single `errors` module
  (`DuplicateKeyError`, `InvalidArgumentsError`).
