/**
 * PathResolver test suite — ported from mocha/chai to vitest.
 *
 * Porting notes / deliberate behavior changes vs old spec:
 *
 * 1. Test harness replaced: mocha `before()`/`it()`/`describe()` map to vitest
 *    `beforeEach()`/`it()`/`describe()`. The `makeDescribeClass`/`makeDescribeFunc`
 *    wrappers from the old TestUtils lib are inlined as plain `describe()` calls.
 *
 * 2. `supressConsole`/`restoreConsole` from the old ConsoleUtils are replaced with
 *    vitest `vi.spyOn()` mocks so tests stay isolated without mutating globals.
 *
 * 3. `runTest` helper from old TestUtils is inlined: each test calls the method
 *    directly, matching the original assertion substance.
 *
 * 4. Error message assertions updated for modern Node (v20+):
 *    - OLD: `Cannot read property 'hasOwnProperty' of undefined`
 *      NEW: toThrow(TypeError) only — message format changed in Node 16+.
 *    - OLD: `Path must be a string. Received undefined`
 *      NEW: toThrow(TypeError) only — Node 12+ changed message format.
 *    Deliberate policy: engine-thrown errors assert type only; library-owned
 *    errors (DuplicateKeyError, InvalidArgumentsError) assert type + message.
 *
 * 5. `_addResolver` NO_RESOLVER_PATH: the TypeError from `path.resolve(undefined, ...)`
 *    fires when the stored resolver function is *called*, not when `_addResolver` is
 *    called. The test now calls the stored function to trigger the error, mirroring
 *    what the old `runTest` helper did (it always called `resolver.resolveSrc()`).
 *
 * 6. `_addResolver` NO_RESOLVER_KEY: when `key` is `undefined`, the resolver stores
 *    the function at key `"undefined"` (not at `"resolveSrc"`), so calling
 *    `resolver.resolveSrc(...)` throws. We port this by asserting that `resolveSrc`
 *    is not set after the call, which is the same observable behavior.
 *
 * 7. `_formatResolverKey` INVALID suite: the old `it()` referenced `INVALID.NO_FILENAME`
 *    which does not exist in that suite's DATA (copy-paste leftover). Ported to call
 *    `_formatResolverKey(undefined)` directly — passing undefined to `.replace()` throws
 *    a TypeError. Recorded as a deliberate harness-artifact fix.
 *
 * 8. `PathResolver.defaultOptions.rootPath` is read from the live class so expected
 *    paths are always computed relative to the same base the resolver uses,
 *    matching the old _header.js pattern.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import nodePath from 'node:path'

import { PathResolver } from '../src/PathResolver.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Create a PathResolver instance while suppressing console output, then restore
 * mocks immediately. Replaces the old supressConsole/restoreConsole pair.
 */
function makeResolver(): PathResolver {
	const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
	const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
	try {
		return new PathResolver()
	} finally {
		warnSpy.mockRestore()
		logSpy.mockRestore()
	}
}

// ---------------------------------------------------------------------------
// PathResolver class
// ---------------------------------------------------------------------------

describe('PathResolver', () => {
	// =========================================================================
	// #_addResolver
	// =========================================================================

	describe('#_addResolver(resolverKey, resolverPath, resolver)', () => {
		let pathResolver: PathResolver

		beforeEach(() => {
			pathResolver = makeResolver()
		})

		// Snapshot the rootPath once so every expected value is computed from the
		// same base the resolver itself uses (mirrors old _header.js pattern).
		const ROOT = PathResolver.defaultOptions.rootPath

		// ---- Test data (mirrors original DATA object) -------------------------

		// Note: each test that mutates `resolver` must use its own fresh object.
		// We define factory functions below for cases that get mutated.
		const VALID_ALL_EXPECTED = { hasKey: true, isFunc: true }

		const VALID_RELATIVE_PATH = {
			resolverKey: 'resolveSrc',
			resolverPath: 'src',
			relativePath: 'index.html',
			expected: { value: nodePath.resolve(ROOT, 'src', 'index.html') },
		}

		const VALID_NO_RELATIVE_PATH = {
			resolverKey: 'resolveSrc',
			resolverPath: 'src',
			relativePath: undefined,
			expected: { value: nodePath.resolve(ROOT, 'src') },
		}

		// ---- Correct creation tests ------------------------------------------

		describe('Correctly creates function and adds to given resolver.', () => {
			it("The 'resolver' object should have 'resolverKey' property", () => {
				const resolver: Record<string, (relativePath?: string) => string> = {}
				pathResolver._addResolver('resolveSrc', 'src', resolver)
				expect(Object.prototype.hasOwnProperty.call(resolver, 'resolveSrc')).toBe(
					VALID_ALL_EXPECTED.hasKey,
				)
			})

			it("The 'resolverKey' property should be a function", () => {
				const resolver: Record<string, (relativePath?: string) => string> = {}
				pathResolver._addResolver('resolveSrc', 'src', resolver)
				expect(typeof resolver['resolveSrc']).toBe('function')
			})
		})

		// ---- Error cases -------------------------------------------------------

		describe('Throws an error if any of the three parameters are undefined', () => {
			it("The 'resolver' is undefined", () => {
				// Old message: "Cannot read property 'hasOwnProperty' of undefined"
				// Modern Node 20+: message format changed (uses "reading 'hasOwnProperty'").
				// DELIBERATE CHANGE: assert TypeError type only, not the exact engine message.
				expect(() => {
					pathResolver._addResolver(
						'resolveSrc',
						'src',
						// @ts-expect-error — deliberately undefined resolver
						undefined,
					)
				}).toThrow(TypeError)
			})

			it("The 'key' is undefined", () => {
				// Old assertion: resolver.resolveSrc is not a function (thrown by runTest helper
				// which always called resolver.resolveSrc() after _addResolver). When key is
				// undefined, the function is stored at resolver["undefined"], leaving resolveSrc
				// unset. We assert the same observable outcome: resolveSrc is not a function.
				const resolver: Record<string, (relativePath?: string) => string> = {}
				// @ts-expect-error — deliberately passing undefined key
				pathResolver._addResolver(undefined, 'src', resolver)
				expect(typeof resolver['resolveSrc']).not.toBe('function')
			})

			it("The 'path' is undefined", () => {
				// Old message: "Path must be a string. Received undefined"
				// Modern Node 20+: message format changed.
				// NOTE: the TypeError fires when the stored resolver *function is called*
				// (path.resolve(undefined, ...) inside it), not when _addResolver is called.
				// The original runTest helper always called resolver.resolveSrc() after
				// _addResolver, so we mirror that here.
				// DELIBERATE CHANGE: assert TypeError type only, not the exact engine message.
				expect(() => {
					const resolver: Record<string, (relativePath?: string) => string> = {}
					pathResolver._addResolver(
						'resolveSrc',
						// @ts-expect-error — deliberately undefined resolverPath
						undefined,
						resolver,
					)
					// Trigger the lazy path.resolve(undefined, ...) call
					resolver['resolveSrc']?.('index.html')
				}).toThrow(TypeError)
			})
		})

		// ---- Generated function returns valid path ----------------------------

		describe('Generated function returns a valid absolute path.', () => {
			it("The 'relativePath' is a valid path", () => {
				const resolver: Record<string, (relativePath?: string) => string> = {}
				const { resolverKey, resolverPath, relativePath, expected } = VALID_RELATIVE_PATH
				pathResolver._addResolver(resolverKey, resolverPath, resolver)
				expect(resolver[resolverKey]?.(relativePath)).toBe(expected.value)
			})

			it("The 'relativePath' is undefined", () => {
				const resolver: Record<string, (relativePath?: string) => string> = {}
				const { resolverKey, resolverPath, relativePath, expected } = VALID_NO_RELATIVE_PATH
				pathResolver._addResolver(resolverKey, resolverPath, resolver)
				expect(resolver[resolverKey]?.(relativePath)).toBe(expected.value)
			})
		})
	})

	// =========================================================================
	// #_formatPath
	// =========================================================================

	describe('#_formatPath(filename, parentPath, rootPath)', () => {
		let pathResolver: PathResolver

		beforeEach(() => {
			pathResolver = makeResolver()
		})

		const ROOT = PathResolver.defaultOptions.rootPath

		const DATA = {
			VALID: {
				ALL: {
					test: { filename: 'index.js', parentPath: 'src', rootPath: ROOT },
					expected: { value: nodePath.resolve(ROOT, 'src', 'index.js') },
				},
				NO_ROOT_PATH: {
					test: { filename: 'index.js', parentPath: 'src' },
					expected: { value: nodePath.resolve('src', 'index.js') },
				},
				NO_PARENT_PATH: {
					test: { filename: 'index.js', rootPath: ROOT },
					expected: { value: nodePath.resolve(ROOT, 'index.js') },
				},
				FILENAME_ONLY: {
					test: { filename: 'index.js' },
					expected: { value: 'index.js' },
				},
			},
			INVALID: {
				NO_FILENAME: {
					test: { parentPath: 'src', rootPath: ROOT },
				},
			},
		}

		describe('Returns an absolute directory path if', () => {
			it('is passed 3 valid params', () => {
				const { filename, parentPath, rootPath } = DATA.VALID.ALL.test
				const value = pathResolver._formatPath(filename, parentPath, rootPath)
				expect(value).toBe(DATA.VALID.ALL.expected.value)
			})

			it("is not passed a valid 'rootPath'", () => {
				const { filename, parentPath } = DATA.VALID.NO_ROOT_PATH.test
				// rootPath is intentionally omitted (undefined)
				const value = pathResolver._formatPath(filename, parentPath, undefined)
				expect(value).toBe(DATA.VALID.NO_ROOT_PATH.expected.value)
			})

			it("is not passed a valid 'parentPath'", () => {
				const { filename, rootPath } = DATA.VALID.NO_PARENT_PATH.test
				// parentPath is intentionally omitted (undefined)
				const value = pathResolver._formatPath(filename, undefined, rootPath)
				expect(value).toBe(DATA.VALID.NO_PARENT_PATH.expected.value)
			})

			it('is passed only a filename (returns filename unchanged)', () => {
				const { filename } = DATA.VALID.FILENAME_ONLY.test
				const value = pathResolver._formatPath(filename)
				expect(value).toBe(DATA.VALID.FILENAME_ONLY.expected.value)
			})
		})

		describe('Throws an error if', () => {
			it('is passed no filename', () => {
				// Old message: "Path must be a string. Received undefined"
				// Modern Node 20+: message format changed.
				// DELIBERATE CHANGE: assert TypeError type only, not the exact engine message.
				expect(() => {
					const { parentPath, rootPath } = DATA.INVALID.NO_FILENAME.test
					// @ts-expect-error — deliberately passing undefined filename
					pathResolver._formatPath(undefined, parentPath, rootPath)
				}).toThrow(TypeError)
			})
		})
	})

	// =========================================================================
	// #_formatResolverKey
	// =========================================================================

	describe('#_formatResolverKey(key)', () => {
		let pathResolver: PathResolver

		beforeEach(() => {
			pathResolver = makeResolver()
		})

		const DATA = {
			VALID: {
				ALL: {
					// scope is part of _getDirectoryResolverKey, not _formatResolverKey;
					// kept here to mirror the old DATA shape, but unused in direct calls.
					test: { key: 'index', scope: 'src' },
					expected: { value: 'resolveIndex' },
				},
				NO_SCOPE: {
					test: { key: 'index', scope: undefined },
					expected: { value: 'resolveIndex' },
				},
			},
			INVALID: {
				// Old spec: `it` referenced `INVALID.NO_FILENAME` which doesn't exist in
				// this suite's DATA — a copy-paste leftover from the _formatPath suite.
				// Ported to test the method directly with an undefined key.
				NO_KEY: {
					test: { key: undefined as unknown as string, scope: 'src' },
				},
			},
		}

		describe('Returns a valid resolver key if', () => {
			it('is passed 2 valid params', () => {
				const { key } = DATA.VALID.ALL.test
				// _formatResolverKey only accepts name; scope goes via _getDirectoryResolverKey
				const value = pathResolver._formatResolverKey(key)
				expect(value).toBe(DATA.VALID.ALL.expected.value)
			})

			it("is not passed a valid 'scope'", () => {
				// scope is not a parameter of _formatResolverKey; result is always 'resolveIndex'
				const { key } = DATA.VALID.NO_SCOPE.test
				const value = pathResolver._formatResolverKey(key)
				expect(value).toBe(DATA.VALID.NO_SCOPE.expected.value)
			})
		})

		describe('Throws an error if', () => {
			it('is passed no key (undefined)', () => {
				// Old test: referenced INVALID.NO_FILENAME (not present in this suite) —
				// the error came from the TestUtils harness receiving undefined, not from the
				// method itself. DELIBERATE CHANGE: ported to call the method with undefined
				// directly. _formatResolverKey calls `.replace(...)` on the name string, which
				// throws TypeError when name is undefined.
				expect(() => {
					// @ts-expect-error — deliberately passing undefined to test runtime behavior
					pathResolver._formatResolverKey(undefined)
				}).toThrow(TypeError)
			})
		})
	})
})
