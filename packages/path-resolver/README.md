# @beautiful-code/path-resolver

Generates relative-path resolver functions and bundler alias maps from a declarative directory-structure definition.

Define your project layout once; get back:

- A **directory resolver** — an object of functions such as `resolveSrc()`, `resolveDistCss()`, etc., each returning an absolute path when called with an optional relative suffix.
- An **alias map** — a plain `Record<string, string>` ready to drop into `webpack.resolve.alias`, Vite's `resolve.alias`, or any similar bundler option.

## Installation

```
pnpm add @beautiful-code/path-resolver
```

## Quick start

```ts
// vite.config.ts (or webpack.config.mjs) — ESM, no __dirname available
import { PathResolver } from '@beautiful-code/path-resolver'

// Single-arg form: rootPath defaults to realpathSync(process.cwd())
const resolver = new PathResolver({
	_: { alias: '@root' }, // registers resolveRoot() + alias "@root"
	src: {
		_: { alias: '@src' }, // registers resolveSrc() + alias "@src"
		components: {}, // registers resolveSrcComponents()
	},
	dist: {
		_: { ignore: true }, // dist itself is not exported as a resolver …
		css: {}, // … but resolveDistCss() is still generated
	},
	libs: { _: { ignoreBranch: true } }, // this dir AND all children are skipped
})
```

If you need an explicit root in an ESM file, derive `__dirname` correctly:

```ts
import { fileURLToPath } from 'node:url'
import nodePath from 'node:path'
import { PathResolver } from '@beautiful-code/path-resolver'

const __dirname = nodePath.dirname(fileURLToPath(import.meta.url))

const resolver = new PathResolver(nodePath.resolve(__dirname, '..'), {
	src: { _: { alias: '@src' } },
	dist: {},
})
```

```ts
// Directory resolver
const { paths } = resolver // or resolver.getDirectoryResolver()
paths.resolveSrc() // → '/absolute/path/to/src'
paths.resolveSrc('index.ts') // → '/absolute/path/to/src/index.ts'
paths.resolveSrcComponents() // → '/absolute/path/to/src/components'

// Alias map
const { aliases } = resolver // or resolver.getAliasMap()
// aliases === { '@root': '/absolute/path/to', '@src': '/absolute/path/to/src' }
```

**Vite** (`vite.config.ts`):

```ts
export default {
	resolve: { alias: resolver.getAliasMap() },
}
```

**webpack** (`webpack.config.cjs`):

```js
module.exports = {
	resolve: { alias: resolver.getAliasMap() },
}
```

## Constructor overloads

```ts
// (paths)
new PathResolver(paths)

// (paths, options)
new PathResolver(paths, options)

// (rootPath, paths)
new PathResolver(rootPath, paths)

// (rootPath, paths, options)
new PathResolver(rootPath, paths, options)

// zero-arg — deferred; call resolver.initialize(...) manually
new PathResolver()
```

## Options

| Option             | Type           | Default                          | Description                                                                              |
| ------------------ | -------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| `rootPath`         | `string`       | `fs.realpathSync(process.cwd())` | Absolute root all resolver functions are relative to.                                    |
| `paths`            | `DirectoryMap` | `{}`                             | The directory-map object (see below).                                                    |
| `namespace`        | `string`       | `'paths'`                        | Property name on the instance that holds the directory resolver.                         |
| `aliasRoot`        | `string`       | `'aliases'`                      | Property name on the instance that holds the alias map.                                  |
| `fileRoot`         | `string`       | `'files'`                        | Property name for file entries (reserved for future use).                                |
| `resolverPrefix`   | `string`       | `'resolve'`                      | Prefix for all generated resolver function names.                                        |
| `depth`            | `number`       | `-1`                             | Max directory depth to process. `-1` = unlimited.                                        |
| `duplicateAliases` | `boolean`      | `false`                          | When `true`, emit both the alias resolver and a plain resolver when an alias is present. |

## Directory-map `_` config options

Each directory object may contain a `_` key with a `DirectoryConfig`:

| Option         | Type      | Default | Description                                                                                                                                                                                     |
| -------------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`         | `string`  | —       | Rename this directory's resolver function (and shift the scope prefix for descendants).                                                                                                         |
| `alias`        | `string`  | —       | Rename the resolver **and** register the directory as an alias root (use `@foo` or `#foo` style). Removes the resolver from the directory resolver and adds the resolved path to the alias map. |
| `ignore`       | `boolean` | `false` | Skip emitting a resolver for this directory; children are still processed.                                                                                                                      |
| `ignoreBranch` | `boolean` | `false` | Skip this directory **and all its descendants** entirely.                                                                                                                                       |

## Public API

```ts
class PathResolver {
	// Accessor helpers
	getDirectoryResolver(): Record<string, (relativePath?: string) => string>
	getAliasMap(): Record<string, string>

	// Build a standalone resolver function (rarely needed directly)
	makeRelativeResolver(rootPath: string): (relativePath?: string) => string

	// Debug
	toString(): string
	printDetails(): void

	// Re-run initialization (useful after zero-arg construction)
	initialize(...args): void

	// Static defaults (read-only reference; do not mutate)
	static defaultOptions: Required<PathResolverOptions>
	static defaultConfig: Required<DirectoryConfig>
}
```

## Exported types

```ts
import type {
	DirectoryConfig,
	DirectoryMap,
	PathResolverOptions,
} from '@beautiful-code/path-resolver'
```

## ESM + CJS

The published package ships both an ESM build (`dist/index.js`) and a CommonJS build (`dist/index.cjs`) with TypeScript declarations (`dist/index.d.ts`). The `exports` map in `package.json` selects the right entrypoint automatically.

During monorepo development, workspace consumers resolve directly to the TypeScript source (`src/index.ts`), so no build step is needed.
