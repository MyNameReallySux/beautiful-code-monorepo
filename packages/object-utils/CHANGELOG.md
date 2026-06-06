# @beautiful-code/object-utils

## 1.0.0

### Major Changes

- 3577278: Modern TypeScript rewrite (ESM + CJS, strict types).

  Breaking/behavior changes vs 0.x:
  - **Removed** `modifyPrototype`, `extendPrototype`, `resetPrototype`,
    `extendedPrototypes` — mutating `Object.prototype` is unacceptable in a
    modern library.
  - The named export `exclude` was a typo pointing at `extend` in 0.x — it now
    exports the real `exclude` function.
  - `extend` now actually validates its `source` argument (the 0.x guard
    `if (!isObject)` tested a function reference and never fired).
  - `omit`'s optional predicate is now called as `fn(key, value)` (0.x called it
    with no arguments).

### Patch Changes

- Updated dependencies [3577278]
  - @beautiful-code/type-utils@1.0.0
