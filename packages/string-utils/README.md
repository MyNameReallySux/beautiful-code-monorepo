# @beautiful-code/string-utils

String manipulation and case-conversion utilities with a chainable stream API.

## Install

```sh
pnpm add @beautiful-code/string-utils
```

## Usage

### Named function imports

```ts
import {
	contains,
	capitalize,
	toCamelCase,
	toKebabCase,
	toSnakeCase,
	toReadable,
	toWordArray,
	stream,
} from '@beautiful-code/string-utils'

// Containment check
contains('hello world', 'world') // true
contains('hello world', 'foo') // false

// Capitalize first letter
capitalize('hello') // 'Hello'

// Case conversions (lowercase by default; pass true to capitalize each word)
toCamelCase('this is a string') // 'thisIsAString'
toCamelCase('this is a string', true) // 'ThisIsAString'

toKebabCase('thisIsAString') // 'this-is-a-string'
toKebabCase('thisIsAString', true) // 'This-Is-A-String'

toSnakeCase('this-is-a-string') // 'this_is_a_string'
toSnakeCase('this-is-a-string', true) // 'This_Is_A_String'

// Readable — strips camelCase / kebab / snake formatting into space-separated words
toReadable('thisIsAString') // 'this is a string'
toReadable('this_is_a_string', ',') // 'this,is,a,string'

// Split into an array of words (handles camelCase, kebab-case, snake_case, spaces, tabs)
toWordArray('thisIsAString') // ['this', 'Is', 'A', 'String']
```

### Class API

```ts
import { StringUtils, StringStream } from '@beautiful-code/string-utils'

StringUtils.toCamelCase('this-is-a-string') // 'thisIsAString'
```

### Chainable stream API

```ts
import { stream } from '@beautiful-code/string-utils'

stream('this is a string')
	.toCamelCase() // 'thisIsAString'
	.capitalize() // 'ThisIsAString'
	.get() // returns the final string

stream('thisIsAString')
	.toKebabCase() // 'this-is-a-string'
	.get()
```

## ESM + CJS

The published package ships both ESM (`dist/index.js`) and CJS (`dist/index.cjs`) bundles with TypeScript declarations (`dist/index.d.ts`). In the monorepo workspace, imports resolve directly to TypeScript source — no build step required for other packages.
