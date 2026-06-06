# @beautiful-code/console-utils

Colored console logging helpers with suppress/restore support.

## Install

```sh
pnpm add @beautiful-code/console-utils
```

## Usage

```ts
import {
	info,
	warn,
	error,
	debug,
	print,
	suppressConsole,
	restoreConsole,
} from '@beautiful-code/console-utils'

// Logs to console.info in cyan
info('Server started on port 3000')

// Logs to console.warn in yellow
warn('Config file not found, using defaults')

// Logs to console.error in red
error('Unhandled exception', err.message)

// Logs to console.log — primitives unchanged, objects as indented JSON
debug('Response received', { status: 200, body: { ok: true } })

// Plain console.log pass-through (no color)
print('raw output')

// Silence all console output
suppressConsole() // canonical spelling
// ... run noisy code ...
restoreConsole() // restores log/warn/error to their original functions
```

### Class API

All functions are also available as static methods on `ConsoleUtils`:

```ts
import { ConsoleUtils } from '@beautiful-code/console-utils'

ConsoleUtils.info('hello')
ConsoleUtils.suppressConsole()
ConsoleUtils.restoreConsole()
```

## Color theme

| Method | Color  | Console method |
| ------ | ------ | -------------- |
| info   | cyan   | console.info   |
| warn   | yellow | console.warn   |
| error  | red    | console.error  |
| debug  | none   | console.log    |
| print  | none   | console.log    |

## Deliberate behavior changes vs the legacy package

### LEVELS / level system removed

The old package exported a `LEVELS` enum and a static `level` property intended
to filter which methods produce output. The implementation was broken: `LEVELS`
values were computed with `&&` (logical AND) instead of `|` (bitwise OR), so
every named level except `none` and `minimal` resolved to `1`. The `debug()`
guard `ConsoleUtils.level && LEVEL_MASKS.debug === LEVEL_MASKS.debug` is always
truthy regardless of `level`, because the right-hand side is a constant
comparison. The system never filtered anything. Rather than invent a new
filtering feature under the old name, `LEVELS` and `level` have been removed
entirely. All five log methods always produce output.

### TestUtils removed

`TestUtils` (runTest / makeDescribeClass / makeDescribeFunc) was mocha-specific
test scaffolding. It is not exported or re-exported from this package.

### colors/safe replaced with picocolors

The old package used the `colors` npm package (`colors/safe`). This package uses
`picocolors` instead — smaller, faster, zero-dependency. The color mapping is
identical (info=cyan, warn=yellow, error=red). Colors are only emitted when the
terminal supports them; in non-TTY environments arguments are passed through
unchanged.

### Multi-argument coloring

The old `colors.info(...args)` spread only colored `args[0]` (the rest were
swallowed by the colors/safe internals). This package applies the color formatter
to each argument individually, so every argument in a multi-arg call is colored.

### supressConsole spelling

The original misspelling `supressConsole` is kept as-is for backward
compatibility. The correctly spelled `suppressConsole` is added as an alias
pointing to the same function.

### print is now suppressible

The old `print = console.log` was a direct reference captured at class-definition
time, so it bypassed `supressConsole`. The new `print` is a wrapper that calls
`console.log` dynamically, so it is affected by suppress/restore.

## ESM + CJS

The package is published with both ESM (`dist/index.js`) and CJS (`dist/index.cjs`)
outputs. In workspace/development mode (before publishing) it resolves directly
to TypeScript source via the `exports` field.
