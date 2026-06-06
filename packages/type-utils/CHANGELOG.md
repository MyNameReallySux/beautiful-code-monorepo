# @beautiful-code/type-utils

## 1.0.0

### Major Changes

- 3577278: Modern TypeScript rewrite (ESM + CJS, strict types, type guards).

  Breaking/behavior changes vs 0.x:
  - `isMap`, `isRegExp`, `isSet`, `isWeakMap` are now actually implemented — they
    were exported but undefined in 0.x, so `getType(new Map())` threw.
  - `getType` now checks specific object types (map, set, date, …) before the
    catch-all `object`, so `getType(new Map())` returns `'map'` instead of
    `'object'`.
  - `isFunction` now accepts async and generator functions (0.x rejected them).
  - `isEmptyObject` rewritten: the 0.x depth logic was dead code that returned
    after inspecting a single key; it now correctly iterates all own keys.
  - `hasLength` / `isEmptyByProperty` no longer throw on `null`/`undefined`.
  - All `is*` methods carry proper TypeScript type-predicate signatures;
    `TypeName`/`NativeTypeName`/`ExtendedTypeName` unions are exported.
