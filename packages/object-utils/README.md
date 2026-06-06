# @beautiful-code/object-utils

Object manipulation utilities: clean, exclude, omit, merge, setDeep, size, swap.

## Install

```sh
pnpm add @beautiful-code/object-utils
```

## Usage

```ts
import {
	clean,
	exclude,
	omit,
	merge,
	setDeep,
	size,
	swap,
	isSwappable,
} from '@beautiful-code/object-utils'
```

### clean

Removes entries whose values are `undefined`, `null`, or `''` (configurable).

```ts
clean({ a: 1, b: null, c: '' })
// => { a: 1 }

clean({ a: 1, b: 0, c: false }, [false])
// => { a: 1, b: 0 }
```

### exclude

Removes entries by value rather than key.

```ts
exclude({ a: 1, b: 2, c: 5 }, 5)
// => { a: 1, b: 2 }

exclude({ a: 1, b: 2, c: 5, d: 3 }, [2, 5])
// => { a: 1, d: 3 }
```

### omit

Removes entries by key.

```ts
omit({ a: 1, b: 2, c: 5 }, 'c')
// => { a: 1, b: 2 }

omit({ a: 1, b: 2, c: 5, d: 3 }, ['b', 'c'])
// => { a: 1, d: 3 }
```

### merge

Deep-merges extensions into source. Nested objects are recursively merged;
arrays are concatenated. `undefined` values in extensions are ignored. Null /
empty-string values in source are stripped.

```ts
merge({ name: 'Joe', age: 25 }, { job: 'Dev' })
// => { name: 'Joe', age: 25, job: 'Dev' }

merge({ manager: { name: 'Joe', age: 25 }, tags: ['a'] }, { manager: { age: 26 }, tags: ['b'] })
// => { manager: { name: 'Joe', age: 26 }, tags: ['a', 'b'] }
```

### setDeep

Sets a deeply nested value via a dot-separated path. Supports array-index
notation (`items[0]`). Intermediate objects are created as needed.

```ts
const obj = {}
setDeep(obj, 42, 'a.b.c')
// obj => { a: { b: { c: 42 } } }
```

### swap

Swaps keys and values. Values must be strings or numbers. Throws on
non-objects, non-swappable values, or duplicates.

```ts
swap({ key: 'value', key2: 'value2' })
// => { value: 'key', value2: 'key2' }
```

### isSwappable

Returns `true` when all values in the object are unique (no collisions after
swap).

```ts
isSwappable({ a: 1, b: 2 }) // true
isSwappable({ a: 1, b: 1 }) // false
```

## ESM + CJS

Published as both ESM (`dist/index.js`) and CJS (`dist/index.cjs`). TypeScript
consumers in the monorepo resolve directly to `src/index.ts` via the `exports`
field — no build step required for workspace usage.

## Removed APIs (breaking vs. v0.1)

The following prototype-mutation APIs have been removed as unsafe for modern
library code:

| Removed                                   | Reason                                                            |
| ----------------------------------------- | ----------------------------------------------------------------- |
| `ObjectUtils.modifyPrototype()`           | Mutates `Object.prototype` — pollutes every object in the process |
| `ObjectUtils.extendPrototype(clazz, ext)` | Mutates arbitrary class prototypes                                |
| `ObjectUtils.resetPrototype(clazz)`       | Counterpart to extendPrototype                                    |
| `ObjectUtils.extendedPrototypes`          | Internal map backing the above                                    |

The reflection helpers (`getInstanceMethods`, `getInstanceProps`,
`getStaticProps`) and all functional utilities are retained unchanged.
