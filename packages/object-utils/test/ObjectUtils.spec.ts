import { describe, it, expect, beforeEach } from 'vitest'

import { ObjectUtils } from '../src/ObjectUtils'

/* ##########################
  Test Helpers
########################## */

/**
 * Replaces the dependency on @beautiful-code/string-utils (not available as a
 * workspace dep for this package). Mirrors what the original formatKey did:
 * convert spaces to underscores and upper-case.
 *
 * Examples:
 *   'obj'         → 'OBJ'
 *   'one hundred' → 'ONE_HUNDRED'
 */
function formatKey(key: string): string {
	return key.replace(/ /g, '_').toUpperCase()
}

/* ##########################
  Tests
########################## */

describe('ObjectUtils', () => {
	// ----------------------------------------------------------------
	// Reflection helpers
	// ----------------------------------------------------------------
	describe('can handle manipulation of object properties', () => {
		class TestClass {
			static staticProp = 'static'
			static staticProp2 = 'static2'

			instanceProp!: string
			instanceProp2!: string
			instanceProp3 = 'value3'
			instanceProp4 = 'value4'

			constructor() {
				this.instanceProp = 'value'
				this.instanceProp2 = 'value2'
			}

			one() {}
			two() {}
		}

		let instance: TestClass
		beforeEach(() => {
			instance = new TestClass()
		})

		describe('#getInstanceMethods', () => {
			it(`should return 3 methods from 'TestClass'`, () => {
				const test = ObjectUtils.getInstanceMethods(instance)
				const expected = 3
				expect(test.length).toBe(expected)
			})
		})

		describe('#getInstanceProps', () => {
			it(`should return 4 instance props from 'TestClass'`, () => {
				const test = ObjectUtils.getInstanceProps(instance)
				const expected = 4
				expect(test.length).toBe(expected)
			})
		})

		describe('#getStaticProps', () => {
			it(`should return 5 static props from 'TestClass'`, () => {
				const test = ObjectUtils.getStaticProps(TestClass)
				const expected = 5
				expect(test.length).toBe(expected)
			})
		})
	})

	// ----------------------------------------------------------------
	// Prototype-mutation APIs removed
	// (modifyPrototype / extendPrototype / resetPrototype /
	//  extendedPrototypes) — BREAKING REMOVAL. Object.prototype mutation
	//  is unacceptable in a modern library. No tests to skip; the original
	//  prototype block was already commented out in the spec.
	// ----------------------------------------------------------------

	// ----------------------------------------------------------------
	// Omit — first describe block (lines 71–109 of original spec)
	// NOTE: the original testOmit / testOmitFunction helpers were defined
	// but never called, so zero tests ran there. Nothing to port.
	// ----------------------------------------------------------------

	// ----------------------------------------------------------------
	// Merge / extend
	// ----------------------------------------------------------------
	describe('can handle merging and extension of objects', () => {
		// TypeUtils.getType used only for description strings in the original;
		// dropped here. Assertions are verbatim (modulo vitest API).
		const TESTS = {
			OBJ: {
				initial: {
					name: 'Joe',
					age: 25,
				},
				extension: {
					job: 'Web Developer',
				},
				expected: {
					name: 'Joe',
					age: 25,
					job: 'Web Developer',
				},
			},
			FUNC: {
				initial: {
					name: 'Joe',
					age: 25,
					getName: () => TESTS.OBJ.initial.name,
				},
				extension: {
					getAge: () => TESTS.OBJ.initial.age,
				},
				expected: 25,
			},
			DEEP: {
				initial: {
					manager: {
						name: 'Joe',
						age: 25,
					},
					employees: [
						{
							name: 'John',
							age: 22,
						},
						{
							name: 'Lisa',
							age: 21,
						},
					],
				},
				extension: {
					manager: {
						name: 'Joe',
						age: 26,
					},
					employees: [
						{
							name: 'Elsa',
							age: 45,
						},
					],
				},
				expected: {
					manager: {
						name: 'Joe',
						age: 26,
					},
					employees: [
						{
							name: 'John',
							age: 22,
						},
						{
							name: 'Lisa',
							age: 21,
						},
						{
							name: 'Elsa',
							age: 45,
						},
					],
				},
			},
		} as const

		// The original #assign describe block calls ObjectUtils.merge (not an
		// assign/extend method). Ported verbatim; the describe label is kept
		// to match the spec structure.
		describe('#assign', () => {
			function testAssign(key: string) {
				const { initial, extension, expected } = TESTS[formatKey(key) as keyof typeof TESTS]

				it(`is of type 'object'`, () => {
					const test = ObjectUtils.merge(
						initial as Record<string, unknown>,
						extension as Record<string, unknown>,
					)
					expect(test).toEqual(expected)
				})
			}

			function testAssignSubFunction(
				key: string,
				callback: (extended: Record<string, unknown>) => unknown,
			) {
				const { initial, extension, expected } = TESTS[formatKey(key) as keyof typeof TESTS]

				it(`is of type 'object' and has functions`, () => {
					const extended = ObjectUtils.merge(
						initial as Record<string, unknown>,
						extension as Record<string, unknown>,
					)
					const test = callback(extended)
					expect(test).toEqual(expected)
				})
			}

			describe('returns extended object if', () => {
				testAssign('obj')
				testAssignSubFunction('func', (extended) => (extended as { getAge: () => number }).getAge())
			})
		})

		describe('#merge', () => {
			function testMerge(key: string, desc?: string) {
				const { initial, extension, expected } = TESTS[formatKey(key) as keyof typeof TESTS]

				it(desc ? `is ${desc}` : `is of type 'object'`, () => {
					const test = ObjectUtils.merge(
						initial as Record<string, unknown>,
						extension as Record<string, unknown>,
					)
					expect(test).toEqual(expected)
				})
			}

			function testMergeSubFunction(
				key: string,
				callback: (extended: Record<string, unknown>) => unknown,
			) {
				const { initial, extension, expected } = TESTS[formatKey(key) as keyof typeof TESTS]

				it(`is of type 'object' and has functions`, () => {
					const extended = ObjectUtils.merge(
						initial as Record<string, unknown>,
						extension as Record<string, unknown>,
					)
					const test = callback(extended)
					expect(test).toEqual(expected)
				})
			}

			describe('returns merged object if', () => {
				testMerge('obj')
				testMerge('deep', "deeply nested 'object'")
				testMergeSubFunction('func', (extended) => (extended as { getAge: () => number }).getAge())
			})
		})
	})

	// ----------------------------------------------------------------
	// Size
	// ----------------------------------------------------------------
	describe('can handle size of objects', () => {
		describe('#size', () => {
			function _generateObjectOfSize(size: number): Record<string, string> {
				const object: Record<string, string> = {}
				for (let i = 0; i < size; i++) {
					object[String(i + 1)] = ''
				}
				return object
			}

			const TESTS = {
				ZERO: { initial: _generateObjectOfSize(0), expected: 0 },
				ONE: { initial: _generateObjectOfSize(1), expected: 1 },
				TEN: { initial: _generateObjectOfSize(10), expected: 10 },
				ONE_HUNDRED: { initial: _generateObjectOfSize(100), expected: 100 },
			}

			function testSize(key: string) {
				const { initial, expected } = TESTS[formatKey(key) as keyof typeof TESTS]

				it(`is type 'object (of size '${expected}')'`, () => {
					const test = ObjectUtils.size(initial)
					expect(test).toBe(expected)
				})
			}

			describe('returns object size if', () => {
				testSize('zero')
				testSize('one')
				testSize('ten')
				testSize('one hundred')
			})
		})
	})

	// ----------------------------------------------------------------
	// Exclude / Omit
	// ----------------------------------------------------------------
	describe('can handle exclusion of keys and values', () => {
		describe('#exclude', () => {
			describe(`returns object with omitted values if`, () => {
				it(`is an object with value existing`, () => {
					const test = { a: 1, b: 2, c: 5 }
					const expected = { a: 1, b: 2 }
					const result = ObjectUtils.exclude(test, 5)
					expect(result).toEqual(expected)
				})

				it(`is an object with value not existing`, () => {
					const test = { a: 1, b: 2, c: 5 }
					const expected = { a: 1, b: 2, c: 5 }
					const result = ObjectUtils.exclude(test, 4)
					expect(result).toEqual(expected)
				})

				it(`is an object with multiple values existing`, () => {
					const test = { a: 1, b: 2, c: 5, d: 2 }
					const expected = { a: 1, c: 5 }
					const result = ObjectUtils.exclude(test, 2)
					expect(result).toEqual(expected)
				})

				it(`is an object and is passed multiple keys`, () => {
					const test = { a: 1, b: 2, c: 5, d: 3 }
					const expected = { a: 1, d: 3 }
					const result = ObjectUtils.exclude(test, [2, 5])
					expect(result).toEqual(expected)
				})
			})
		})

		describe('#omit', () => {
			describe(`returns object with omitted key if`, () => {
				it(`is an object with key existing`, () => {
					const test = { a: 1, b: 2, c: 5 }
					const expected = { a: 1, b: 2 }
					const result = ObjectUtils.omit(test, 'c')
					expect(result).toEqual(expected)
				})

				it(`is an object with key not existing`, () => {
					const test = { a: 1, b: 2, c: 5 }
					const expected = { a: 1, b: 2, c: 5 }
					const result = ObjectUtils.omit(test, 'd')
					expect(result).toEqual(expected)
				})

				it(`is an object and is passed multiple keys`, () => {
					const test = { a: 1, b: 2, c: 5, d: 3 }
					const expected = { a: 1, d: 3 }
					const result = ObjectUtils.omit(test, ['b', 'c'])
					expect(result).toEqual(expected)
				})
			})
		})
	})

	// ----------------------------------------------------------------
	// Swap / isSwappable
	// ----------------------------------------------------------------
	describe('can handle swapping keys and values', () => {
		const TEST = {
			STRINGS: {
				key: 'value',
				key2: 'value2',
			},
			NUMBERS: {
				1: 3,
				2: 1,
				3: 2,
			},
			FLOATS: {
				1: 0.4,
				1.75: 2,
				3: 1.25,
			},
		}

		const EXPECTED = {
			STRINGS: {
				value: 'key',
				value2: 'key2',
			},
			NUMBERS: {
				3: 1,
				1: 2,
				2: 3,
			},
			FLOATS: {
				0.4: 1,
				2: 1.75,
				1.25: 3,
			},
		}

		const THROWS = {
			UNDEFINED: undefined,
			NULL: null,
			BOOLEAN: false,
			FLOAT: 0.4,

			STRINGS: {
				key: 'value',
				key2: 'value',
			},
			NUMBERS: {
				3: 1,
				1: 2,
				2: 2,
			},
			FLOATS: {
				1: 0.4,
				1.75: 0.4,
				3: 1.25,
			},
		}

		describe('#isSwappable', () => {
			function testIsSwappable(obj: unknown, type: string, expected = true) {
				const desc = expected ? 'unique' : 'duplicated'
				it(`'${type}' properties are ${desc}`, () =>
					expect(ObjectUtils.isSwappable(obj)).toBe(expected))
			}

			describe('returns true if', () => {
				testIsSwappable(TEST.STRINGS, 'string')
				testIsSwappable(TEST.NUMBERS, 'number')
				testIsSwappable(TEST.FLOATS, 'float')
			})

			describe('returns false if', () => {
				testIsSwappable(THROWS.STRINGS, 'string', false)
				testIsSwappable(THROWS.NUMBERS, 'number', false)
				testIsSwappable(THROWS.FLOATS, 'float', false)
			})
		})

		describe('#swap', () => {
			function testSwap(obj: unknown, type: string, expected: unknown) {
				it(`handles objects with '${type}' values`, () =>
					expect(ObjectUtils.swap(obj)).toEqual(expected))
			}

			describe('returns swapped object if', () => {
				testSwap(TEST.STRINGS, 'string', EXPECTED.STRINGS)
				testSwap(TEST.NUMBERS, 'number', EXPECTED.NUMBERS)
				testSwap(TEST.FLOATS, 'float', EXPECTED.FLOATS)
			})

			describe('throws an error if', () => {
				it(`passed a non-object, or if object has non-string or non-number properties`, () => {
					for (const test of Object.values(THROWS)) {
						expect(() => ObjectUtils.swap(test)).toThrow()
					}
				})
			})
		})
	})
})
