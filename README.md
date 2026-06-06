# beautiful-code-monorepo

Modern monorepo for the `@beautiful-code/*` utility packages. Consolidates five
formerly separate repos into one workspace with a single toolchain.

## Packages

| Package                                                   | Description                                                     |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| [`@beautiful-code/type-utils`](packages/type-utils)       | Runtime type identification + validation with TS type guards    |
| [`@beautiful-code/string-utils`](packages/string-utils)   | Case conversion (camel/kebab/snake/readable) + chainable stream |
| [`@beautiful-code/object-utils`](packages/object-utils)   | clean / exclude / omit / merge / setDeep / size / swap          |
| [`@beautiful-code/console-utils`](packages/console-utils) | Colored console logging with suppress/restore                   |
| [`@beautiful-code/path-resolver`](packages/path-resolver) | Directory map → resolver functions + bundler alias map          |

Internal dependency graph: `type-utils` ← `string-utils`, `object-utils`,
`console-utils` ← `path-resolver`.

## Stack

- **pnpm workspaces** — package management + workspace linking
- **TypeScript** (strict) — `moduleResolution: bundler`, `verbatimModuleSyntax`
- **tsup** — builds ESM + CJS + `.d.ts` per package
- **vitest** — single test runner at the root
- **ESLint 9 (flat) + Prettier** — lint/format
- **Changesets** — versioning, changelogs, npm publishing
- **GitHub Actions** — lint → typecheck → build → test on Node 20/22

Packages use the _internal packages_ pattern: `exports` points at
`src/index.ts` during development (no build step needed for tests/typecheck);
`publishConfig` rewrites entries to `dist/` at publish time.

## Development

```sh
pnpm install
pnpm test        # vitest, all packages
pnpm typecheck   # tsc --noEmit, per package
pnpm lint
pnpm build       # tsup, per package
```

## Releasing

```sh
pnpm changeset            # record a change
pnpm changeset version    # bump versions + changelogs
pnpm release              # build + publish to npm
```

## History

These packages began life in 2017–2018 as separate repos
([string-utils](https://github.com/MyNameReallySux/string-utils),
[type-utils](https://github.com/MyNameReallySux/type-utils),
[object-utils](https://github.com/MyNameReallySux/object-utils),
[console-utils](https://github.com/MyNameReallySux/console-utils),
[path-resolver](https://github.com/MyNameReallySux/path-resolver) — now
archived). The 1.0 release is a modern TypeScript port that preserves the
public API, ports the original mocha test suites to vitest, and fixes several
latent bugs (see each package's CHANGELOG).
