# @beautiful-code/type-utils

Runtime type identification and validation utilities with TypeScript type guards. Ships ESM and CJS with full `.d.ts` declarations.

## Install

```sh
pnpm add @beautiful-code/type-utils
```

## Usage

### Identify a type

```ts
import { getType, getNativeType } from '@beautiful-code/type-utils'

getType([]) // 'array'
getType(new Map()) // 'map'
getType(new Date()) // 'date'
getType(null) // 'null'
getType(undefined) // 'undefined'

getNativeType([]) // 'array'
getNativeType({}) // 'object'
getNativeType(42) // 'number'
```

`getType` covers both native types and extended object sub-types (`args`, `date`, `error`, `map`, `regexp`, `set`, `weakmap`). `getNativeType` covers only native types and always returns `'object'` for any plain or class-instance object.

### Type guards

All guards are TypeScript type predicates and can be used directly as type narrowing conditions.

```ts
import {
	isArray,
	isBoolean,
	isFunction,
	isNumber,
	isObject,
	isString,
	isSymbol,
	isArgs,
	isDate,
	isError,
	isMap,
	isRegExp,
	isSet,
	isWeakMap,
	isUndefined,
	isNull,
} from '@beautiful-code/type-utils'

isString('hello') // true  — narrows to string
isArray([1, 2, 3]) // true  — narrows to unknown[]
isMap(new Map()) // true  — narrows to Map<unknown, unknown>
isNull(null) // true  — narrows to null
isUndefined(undefined) // true  — narrows to undefined
```

### Empty checks

```ts
import { isEmpty, isEmptyString, isEmptyArray, isEmptyObject } from '@beautiful-code/type-utils'

isEmpty('') // true
isEmpty([]) // true
isEmpty({}) // true
isEmpty(null) // true
isEmpty(0) // false  (numbers are never empty)

isEmptyString('') // true
isEmptyString(' ', true) // true  (strict: strips whitespace first)
isEmptyString(42) // undefined  (not a string — returns undefined, not false)

isEmptyArray([]) // true
isEmptyArray(['x']) // false
isEmptyArray(null) // undefined  (not an array)
```

`isEmpty` accepts an optional `strict` flag (default `true`) and a `depth` limit for recursive empty-checking of nested arrays and objects.

### Class-based API

All utilities are also available as static methods on the `TypeUtils` class and as the default export:

```ts
import TypeUtils from '@beautiful-code/type-utils'
// or:
import { TypeUtils } from '@beautiful-code/type-utils'

TypeUtils.isString('hello') // true
TypeUtils.getType(new Set()) // 'set'
```

## Package format

| Field | Path              |
| ----- | ----------------- |
| ESM   | `dist/index.js`   |
| CJS   | `dist/index.cjs`  |
| Types | `dist/index.d.ts` |
