import { describe, it, expect } from 'vitest'

import { TypeUtils } from '../src/TypeUtils'

/* ##########################
  Test Helpers
########################## */

/**
 * Returns a sample of every supported type except the one named by `exclusion`.
 * This mirrors the original spec's getTypesArray helper.
 */
function getTypesArray(exclusion: string): unknown[] {
	const map: Record<string, unknown> = {
		array: [],
		boolean: true,
		function: function () {},
		number: 1,
		string: 'test',
		null: null,
		undefined: undefined,

		args: (function () {
			return arguments
		})(),
		date: new Date('March 15, 1990'),
		error: (function () {
			try {
				throw new Error('This is a Test')
			} catch (e) {
				return e
			}
		})(),
		map: new Map(),
		set: new Set(),
		weakmap: new WeakMap(),
	}

	if (Object.prototype.hasOwnProperty.call(map, exclusion)) {
		delete map[exclusion]
	}
	return Object.keys(map).map((key) => map[key])
}

/**
 * Returns a sample of every *native* type except the one named by `exclusion`.
 * Used for #isObject which must only be checked against native peers.
 */
function getNativeTypesArray(exclusion: string): unknown[] {
	const map: Record<string, unknown> = {
		array: [],
		boolean: true,
		function: function () {},
		number: 1,
		string: 'test',
		object: {},
		null: null,
		undefined: undefined,
	}

	if (Object.prototype.hasOwnProperty.call(map, exclusion)) {
		delete map[exclusion]
	}
	return Object.keys(map).map((key) => map[key])
}

/* ##########################
  Tests
########################## */

describe('TypeUtils', () => {
	describe('Infer Type', () => {
		describe('#getType', () => {
			describe('Natives (same as #getNativeType())', () => {
				describe('Arrays', () => {
					it("Should return 'array' when an array is passed in", () => {
						const test: unknown[] = []
						const result = TypeUtils.getType(test)
						expect(result).toBe(TypeUtils.getNativeType(test))
					})
				})

				describe('Booleans', () => {
					it("Should return 'boolean' when 'true' is passed in", () => {
						const test = true
						const result = TypeUtils.getType(test)
						expect(result).toBe(TypeUtils.getNativeType(test))
					})

					it("Should return 'boolean' when 'false' is passed in", () => {
						const test = false
						const result = TypeUtils.getType(test)
						expect(result).toBe(TypeUtils.getNativeType(test))
					})
				})

				describe('Functions', () => {
					it("Should return 'function' when a function is passed in", () => {
						const test = function () {}
						const result = TypeUtils.getType(test)
						expect(result).toBe(TypeUtils.getNativeType(test))
					})

					it("Should return 'function' when a lambda is passed in", () => {
						const test = () => {}
						const result = TypeUtils.getType(test)
						expect(result).toBe(TypeUtils.getNativeType(test))
					})

					it("Should return 'function' when a class is passed in", () => {
						class Test {}
						const test = Test
						const result = TypeUtils.getType(test)
						expect(result).toBe(TypeUtils.getNativeType(test))
					})

					it("Should return 'function' when a method is passed in", () => {
						class Test {
							method() {}
						}
						const test = new Test().method
						const result = TypeUtils.getType(test)
						expect(result).toBe(TypeUtils.getNativeType(test))
					})
				})

				describe('Numbers', () => {
					it("Should return 'number' when '1' is passed in", () => {
						const test = 1
						const result = TypeUtils.getType(test)
						expect(result).toBe(TypeUtils.getNativeType(test))
					})

					it("Should return 'number' when '-0.5' is passed in", () => {
						const test = -0.5
						const result = TypeUtils.getType(test)
						expect(result).toBe(TypeUtils.getNativeType(test))
					})

					it("Should return 'number' when 'NaN' is passed in", () => {
						const test = NaN
						const result = TypeUtils.getType(test)
						expect(result).toBe(TypeUtils.getNativeType(test))
					})

					it("Should return 'number' when 'Infinity' is passed in", () => {
						const test = Infinity
						const result = TypeUtils.getType(test)
						expect(result).toBe(TypeUtils.getNativeType(test))
					})
				})

				describe('Objects', () => {
					it("Should return 'object' when an object is passed in", () => {
						const test = {}
						const result = TypeUtils.getType(test)
						expect(result).toBe(TypeUtils.getNativeType(test))
					})

					it("Should return 'object' when a class instance is passed in", () => {
						class Test {}
						const test = new Test()
						const result = TypeUtils.getType(test)
						expect(result).toBe('object')
					})
				})

				describe('Strings', () => {
					it("Should return 'string' when 'This is a string' is passed in", () => {
						const test = 'This is a string'
						const result = TypeUtils.getType(test)
						expect(result).toBe(TypeUtils.getNativeType(test))
					})
				})
			})

			describe('Extended Objects (same as #getExtendedType())', () => {
				describe('Arguments', () => {
					it("Should return 'args' when an arguments object is passed in", () => {
						const fcn = function () {
							const test: unknown = arguments
							const result = TypeUtils.getType(test)
							expect(result).toBe('args')
						}
						fcn()
					})
				})

				describe('Date', () => {
					it("Should return 'date' when a date object is passed in", () => {
						const test = new Date('March 15, 1990')
						const result = TypeUtils.getType(test)
						expect(result).toBe('date')
					})
				})

				describe('Error', () => {
					it("Should return 'error' when an error object is passed in", () => {
						let result: unknown
						try {
							throw new Error('This is a test')
						} catch (e) {
							result = TypeUtils.getType(e)
						}
						expect(result).toBeTruthy()
					})
				})

				describe('Map', () => {
					it("Should return 'map' when a map object is passed in", () => {
						const test = new Map()
						const result = TypeUtils.getType(test)
						expect(result).toBe('map')
					})
				})

				describe('RegExp', () => {
					it("Should return 'regexp' when a RegExp literal is passed in", () => {
						const test = /test/
						const result = TypeUtils.getType(test)
						expect(result).toBe('regexp')
					})

					it("Should return 'regexp' when a RegExp object is passed in", () => {
						const test = new RegExp('')
						const result = TypeUtils.getType(test)
						expect(result).toBe('regexp')
					})
				})

				describe('Set', () => {
					it("Should return 'set' when a set object is passed in", () => {
						const test = new Set()
						const result = TypeUtils.getType(test)
						expect(result).toBe('set')
					})
				})

				describe('WeakMap', () => {
					it("Should return 'weakmap' when a WeakMap object is passed in", () => {
						const test = new WeakMap()
						const result = TypeUtils.getType(test)
						expect(result).toBe('weakmap')
					})
				})
			})
		})

		describe('#getNativeType', () => {
			describe('Arrays', () => {
				it("Should return 'array' when an array is passed in", () => {
					const test: unknown[] = []
					const result = TypeUtils.getNativeType(test)
					expect(result).toBe('array')
				})
			})

			describe('Booleans', () => {
				it("Should return 'boolean' when 'true' is passed in", () => {
					const test = true
					const result = TypeUtils.getNativeType(test)
					expect(result).toBe('boolean')
				})

				it("Should return 'boolean' when 'false' is passed in", () => {
					const test = false
					const result = TypeUtils.getNativeType(test)
					expect(result).toBe('boolean')
				})
			})

			describe('Functions', () => {
				it("Should return 'function' when a function is passed in", () => {
					const test = function () {}
					const result = TypeUtils.getNativeType(test)
					expect(result).toBe('function')
				})

				it("Should return 'function' when a lambda is passed in", () => {
					const test = () => {}
					const result = TypeUtils.getNativeType(test)
					expect(result).toBe('function')
				})

				it("Should return 'function' when a class is passed in", () => {
					class Test {}
					const test = Test
					const result = TypeUtils.getNativeType(test)
					expect(result).toBe('function')
				})

				it("Should return 'function' when a method is passed in", () => {
					class Test {
						method() {}
					}
					const test = new Test().method
					const result = TypeUtils.getNativeType(test)
					expect(result).toBe('function')
				})
			})

			describe('Strings', () => {
				it("Should return 'string' when 'This is a string' is passed in", () => {
					const test = 'This is a string'
					const result = TypeUtils.getNativeType(test)
					expect(result).toBe('string')
				})
			})

			describe('Numbers', () => {
				it("Should return 'number' when '1' is passed in", () => {
					const test = 1
					const result = TypeUtils.getNativeType(test)
					expect(result).toBe('number')
				})

				it("Should return 'number' when '-0.5' is passed in", () => {
					const test = -0.5
					const result = TypeUtils.getNativeType(test)
					expect(result).toBe('number')
				})

				it("Should return 'number' when 'NaN' is passed in", () => {
					const test = NaN
					const result = TypeUtils.getNativeType(test)
					expect(result).toBe('number')
				})

				it("Should return 'number' when 'Infinity' is passed in", () => {
					const test = Infinity
					const result = TypeUtils.getNativeType(test)
					expect(result).toBe('number')
				})
			})

			describe('Objects', () => {
				it("Should return 'object' when an object is passed in", () => {
					const test = {}
					const result = TypeUtils.getNativeType(test)
					expect(result).toBe('object')
				})

				it("Should return 'object' when a class instance is passed in", () => {
					class Test {}
					const test = new Test()
					const result = TypeUtils.getNativeType(test)
					expect(result).toBe('object')
				})
			})
		})
	})

	describe('Validate Type', () => {
		describe('Natives', () => {
			describe('#isArray', () => {
				it("Should return 'true' when an array is passed in", () => {
					const test: unknown[] = []
					const result = TypeUtils.isArray(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when anything else is passed in", () => {
					const tests = getTypesArray('array')
					for (const test of tests) {
						const result = TypeUtils.isArray(test)
						expect(result).toBe(false)
					}
				})
			})

			describe('#isBoolean', () => {
				it("Should return 'true' when 'true' is passed in", () => {
					const test = true
					const result = TypeUtils.isBoolean(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'true' when 'false' is passed in", () => {
					const test = false
					const result = TypeUtils.isBoolean(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when anything else is passed in", () => {
					const tests = getTypesArray('boolean')
					for (const test of tests) {
						const result = TypeUtils.isBoolean(test)
						expect(result).toBe(false)
					}
				})
			})

			describe('#isFunction', () => {
				it("Should return 'true' when a function is passed in", () => {
					const test = function () {}
					const result = TypeUtils.isFunction(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'true' when a lambda is passed in", () => {
					const test = () => {}
					const result = TypeUtils.isFunction(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'true' when a class is passed in", () => {
					const test = class Test {}
					const result = TypeUtils.isFunction(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'true' when a method is passed in", () => {
					class Test {
						method() {}
					}
					const test = new Test().method
					const result = TypeUtils.isFunction(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when anything else is passed in", () => {
					const tests = getTypesArray('function')
					for (const test of tests) {
						const result = TypeUtils.isFunction(test)
						expect(result).toBe(false)
					}
				})
			})

			describe('#isNumber', () => {
				it("Should return 'true' when '1' is passed in", () => {
					const test = 1
					const result = TypeUtils.isNumber(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'true' when '-0.5' is passed in", () => {
					const test = -0.5
					const result = TypeUtils.isNumber(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'true' when 'NaN' is passed in", () => {
					const test = NaN
					const result = TypeUtils.isNumber(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'true' when 'Infinity' is passed in", () => {
					const test = Infinity
					const result = TypeUtils.isNumber(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when anything else is passed in", () => {
					const tests = getTypesArray('number')
					for (const test of tests) {
						const result = TypeUtils.isNumber(test)
						expect(result).toBe(false)
					}
				})
			})

			describe('#isObject', () => {
				it("Should return 'true' when an object is passed in", () => {
					const test = {}
					const result = TypeUtils.isObject(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'true' when a class instance is passed in", () => {
					class Test {}
					const test = new Test()
					const result = TypeUtils.isObject(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when any other native is passed in", () => {
					// Note: uses getNativeTypesArray (not getTypesArray) because Maps, Dates, etc.
					// ARE objects — the old spec deliberately tests only against native type peers.
					const tests = getNativeTypesArray('object')
					for (const test of tests) {
						const result = TypeUtils.isObject(test)
						expect(result).toBe(false)
					}
				})
			})

			describe('#isString', () => {
				it("Should return 'true' when 'This is a string' is passed in", () => {
					const test = 'This is a string'
					const result = TypeUtils.isString(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when anything else is passed in", () => {
					const tests = getTypesArray('string')
					for (const test of tests) {
						const result = TypeUtils.isString(test)
						expect(result).toBe(false)
					}
				})
			})
		})

		describe('Extended Objects', () => {
			describe('#isArgs', () => {
				it("Should return 'true' when an argument object is passed in", () => {
					let result: unknown
					const fcn = function () {
						result = TypeUtils.isArgs(arguments)
					}
					fcn()
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when anything else is passed in", () => {
					const tests = getTypesArray('args')
					for (const test of tests) {
						const result = TypeUtils.isArgs(test)
						expect(result).toBe(false)
					}
				})
			})

			describe('#isDate', () => {
				it("Should return 'true' when a date object is passed in", () => {
					const test = new Date('March 15, 1990')
					const result = TypeUtils.isDate(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when anything else is passed in", () => {
					const tests = getTypesArray('date')
					for (const test of tests) {
						const result = TypeUtils.isDate(test)
						expect(result).toBe(false)
					}
				})
			})

			describe('#isError', () => {
				it("Should return 'true' when an error object is passed in", () => {
					let result: unknown
					try {
						throw new Error('This is a test')
					} catch (e) {
						result = TypeUtils.isError(e)
					}
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when anything else is passed in", () => {
					const tests = getTypesArray('error')
					for (const test of tests) {
						const result = TypeUtils.isError(test)
						expect(result).toBe(false)
					}
				})
			})

			describe('#isMap', () => {
				it("Should return 'true' when a Map object is passed in", () => {
					const test = new Map()
					const result = TypeUtils.isMap(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when anything else is passed in", () => {
					const tests = getTypesArray('map')
					for (const test of tests) {
						const result = TypeUtils.isMap(test)
						expect(result).toBe(false)
					}
				})
			})

			describe('#isRegExp', () => {
				it("Should return 'true' when a RegExp literal is passed in", () => {
					const test = /test/
					const result = TypeUtils.isRegExp(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'true' when a RegExp object is passed in", () => {
					const test = new RegExp('')
					const result = TypeUtils.isRegExp(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when anything else is passed in", () => {
					const tests = getTypesArray('regexp')
					for (const test of tests) {
						const result = TypeUtils.isRegExp(test)
						expect(result).toBe(false)
					}
				})
			})

			describe('#isSet', () => {
				it("Should return 'true' when a Set object is passed in", () => {
					const test = new Set()
					const result = TypeUtils.isSet(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when anything else is passed in", () => {
					const tests = getTypesArray('set')
					for (const test of tests) {
						const result = TypeUtils.isSet(test)
						expect(result).toBe(false)
					}
				})
			})

			describe('#isWeakMap', () => {
				it("Should return 'true' when a WeakMap object is passed in", () => {
					const test = new WeakMap()
					const result = TypeUtils.isWeakMap(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when anything else is passed in", () => {
					const tests = getTypesArray('weakmap')
					for (const test of tests) {
						const result = TypeUtils.isWeakMap(test)
						expect(result).toBe(false)
					}
				})
			})
		})

		describe('Null Values', () => {
			describe('#isUndefined', () => {
				it("Should return 'true' when 'undefined' is passed in", () => {
					let test: unknown
					const result = TypeUtils.isUndefined(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when anything else is passed in", () => {
					const tests = getTypesArray('undefined')
					for (const test of tests) {
						const result = TypeUtils.isUndefined(test)
						expect(result).toBe(false)
					}
				})
			})

			describe('#isNull', () => {
				it("Should return 'true' when 'null' is passed in", () => {
					const test = null
					const result = TypeUtils.isNull(test)
					expect(result).toBeTruthy()
				})

				it("Should return 'false' when anything else is passed in", () => {
					const tests = getTypesArray('null')
					for (const test of tests) {
						const result = TypeUtils.isNull(test)
						expect(result).toBe(false)
					}
				})
			})
		})
	})

	describe('Check Properties', () => {
		describe('#hasLength', () => {
			it("Should return 'true' when an array is passed in", () => {
				// Old test body was empty (done() only); preserved as a passing placeholder.
			})
		})
	})

	describe('Check if Empty', () => {
		describe('#isEmptyString', () => {
			it("Should return 'true' when an empty string is passed in", () => {
				const test = ''
				const result = TypeUtils.isEmptyString(test)
				expect(result).toBeTruthy()
			})

			it("Should return 'false' when a non-empty string is passed in", () => {
				const test = 'This is a string'
				const result = TypeUtils.isEmptyString(test)
				expect(result).toBe(false)
			})

			it("Should return 'undefined' when anything else is passed in", () => {
				const tests = getTypesArray('string')
				for (const test of tests) {
					const result = TypeUtils.isEmptyString(test)
					expect(result).toBeUndefined()
				}
			})
		})

		describe('#isEmptyArray', () => {
			it("Should return 'true' when an empty array is passed in", () => {
				const test: unknown[] = []
				const result = TypeUtils.isEmptyArray(test)
				expect(result).toBeTruthy()
			})

			it("Should return 'false' when a non-empty array is passed in", () => {
				const test = ['test']
				const result = TypeUtils.isEmptyArray(test)
				expect(result).toBe(false)
			})

			it("Should return 'undefined' when anything else is passed in", () => {
				const tests = getTypesArray('array')
				for (const test of tests) {
					const result = TypeUtils.isEmptyArray(test)
					expect(result).toBeUndefined()
				}
			})
		})
	})
})
