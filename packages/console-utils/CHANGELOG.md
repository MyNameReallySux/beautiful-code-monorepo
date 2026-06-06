# @beautiful-code/console-utils

## 1.0.0

### Major Changes

- 3577278: Modern TypeScript rewrite (ESM + CJS), `colors` replaced with `picocolors`.

  Breaking/behavior changes vs 0.x:
  - **Removed** the `LEVELS`/`LEVEL_MASKS`/`level` system. It was broken by
    construction (`&&` instead of bitwise `|`; the `debug()` guard was a
    tautology) and never filtered any output. Rather than invent a filtering
    feature 0.x never had, all five log methods always produce output.
  - **Removed** `TestUtils` (`runTest`, `makeDescribeClass`, `makeDescribeFunc`)
    — mocha-specific scaffolding, obsolete in the vitest era.
  - `suppressConsole` added with correct spelling; the original `supressConsole`
    is kept as a compatible alias.
  - `print` is now suppressible (0.x captured a direct `console.log` reference
    that bypassed `supressConsole`).
  - Multi-argument calls now color every argument (0.x only colored the first).

### Patch Changes

- Updated dependencies [3577278]
  - @beautiful-code/type-utils@1.0.0
