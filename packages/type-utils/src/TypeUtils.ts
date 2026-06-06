/* ##########################
  Type Definitions
########################## */

export type NativeTypeName =
	| 'array'
	| 'boolean'
	| 'function'
	| 'number'
	| 'string'
	| 'symbol'
	| 'object'
	| 'undefined'
	| 'null'

export type ExtendedTypeName = 'args' | 'date' | 'error' | 'map' | 'regexp' | 'set' | 'weakmap'

export type TypeName = NativeTypeName | ExtendedTypeName

/* ##########################
  Class Definition
########################## */

class TypeUtils {
	/* ##########################
	  Constants
	########################## */

	private static readonly MAX_RECURSIVE_DEPTH = 21

	// Extended object guards must come BEFORE 'object' so getType(new Map()) → 'map',
	// not 'object'. Spread order: extended first, then native (native 'object' is last
	// native that would swallow all objects).
	private static readonly defaultObjectTypeUtils: Record<
		ExtendedTypeName,
		(test: unknown) => boolean
	> = {
		args: TypeUtils.isArgs,
		date: TypeUtils.isDate,
		error: TypeUtils.isError,
		map: TypeUtils.isMap,
		regexp: TypeUtils.isRegExp,
		set: TypeUtils.isSet,
		weakmap: TypeUtils.isWeakMap,
	} as const

	private static readonly defaultNativeTypeUtils: Record<
		NativeTypeName,
		(test: unknown) => boolean
	> = {
		array: TypeUtils.isArray,
		boolean: TypeUtils.isBoolean,
		function: TypeUtils.isFunction,
		number: TypeUtils.isNumber,
		string: TypeUtils.isString,
		symbol: TypeUtils.isSymbol,
		object: TypeUtils.isObject,
		undefined: TypeUtils.isUndefined,
		null: TypeUtils.isNull,
	} as const

	// Extended types spread before native so that specific object sub-types are
	// matched before the catch-all 'object' guard.
	private static readonly defaultTypeUtils: Record<TypeName, (test: unknown) => boolean> = {
		...TypeUtils.defaultObjectTypeUtils,
		...TypeUtils.defaultNativeTypeUtils,
	} as const

	/* ##########################
	  Get Type
	########################## */

	public static getType(
		test: unknown,
		types: Record<string, (test: unknown) => boolean> = TypeUtils.defaultTypeUtils,
	): TypeName | string | undefined {
		for (const key in types) {
			if (Object.prototype.hasOwnProperty.call(types, key)) {
				const guard = types[key]
				if (guard !== undefined && guard(test)) {
					return key
				}
			}
		}
		return undefined
	}

	public static getNativeType(
		test: unknown,
		types: Record<string, (test: unknown) => boolean> = TypeUtils.defaultNativeTypeUtils,
	): NativeTypeName | string | undefined {
		for (const key in types) {
			if (Object.prototype.hasOwnProperty.call(types, key)) {
				const guard = types[key]
				if (guard !== undefined && guard(test)) {
					return key
				}
			}
		}
		return undefined
	}

	public static getObjectType(test: unknown): string {
		return Object.prototype.toString.call(test)
	}

	/* ##########################
	  Is Type — natives
	########################## */

	static isArray<T = unknown>(test: unknown): test is T[] {
		return Array.isArray(test)
	}

	static isBoolean(test: unknown): test is boolean {
		return typeof test === 'boolean' || TypeUtils.getObjectType(test) === '[object Boolean]'
	}

	static isFunction<Fn extends (...args: unknown[]) => unknown>(test: unknown): test is Fn {
		return typeof test === 'function'
	}

	static isNumber(test: unknown): test is number {
		return typeof test === 'number' || TypeUtils.getObjectType(test) === '[object Number]'
	}

	static isObject<O extends Record<string, unknown>>(test: unknown): test is O {
		return test === Object(test) && typeof test === 'object' && !TypeUtils.isArray(test)
	}

	static isString(test: unknown): test is string {
		return typeof test === 'string' || TypeUtils.getObjectType(test) === '[object String]'
	}

	static isSymbol(test: unknown): test is symbol {
		return typeof test === 'symbol'
	}

	/* ##########################
	  Is Type — extended objects
	########################## */

	static isArgs(test: unknown): test is IArguments {
		return TypeUtils.getObjectType(test) === '[object Arguments]'
	}

	static isDate(test: unknown): test is Date {
		return TypeUtils.getObjectType(test) === '[object Date]'
	}

	static isError(test: unknown): test is Error {
		return test instanceof Error
	}

	static isMap<K = unknown, V = unknown>(test: unknown): test is Map<K, V> {
		return test instanceof Map
	}

	static isRegExp(test: unknown): test is RegExp {
		return test instanceof RegExp
	}

	static isSet<V = unknown>(test: unknown): test is Set<V> {
		return test instanceof Set
	}

	static isWeakMap<K extends WeakKey = WeakKey, V = unknown>(test: unknown): test is WeakMap<K, V> {
		return test instanceof WeakMap
	}

	/* ##########################
	  Is Type — null-ish
	########################## */

	static isUndefined(test: unknown): test is undefined {
		return test === undefined
	}

	static isNull(test: unknown): test is null {
		return test === null
	}

	/* ##########################
	  Has Properties
	########################## */

	static hasLength(test: unknown): boolean {
		return test != null && Object.prototype.hasOwnProperty.call(test, 'length')
	}

	/* ##########################
	  Is Empty
	########################## */

	static isEmptyString(test: unknown, strict = false): boolean | undefined {
		if (TypeUtils.isString(test)) {
			const subject = strict ? test.replace(/\s+/g, '') : test
			return subject.length <= 0
		}
		return undefined
	}

	static isEmptyArray(test: unknown, strict = false, depth = -1): boolean | undefined {
		if (TypeUtils.isArray(test)) {
			if (depth === 0) return test.length <= 0
			const nextDepth = depth === -1 ? TypeUtils.MAX_RECURSIVE_DEPTH - 1 : depth - 1

			if (test.length > 0 && strict) {
				for (const element of test) {
					if (!TypeUtils.isEmpty(element, strict, nextDepth)) return false
				}
				return true
			}
			return test.length === 0
		}
		return undefined
	}

	/**
	 * Returns true if the object has no own enumerable keys.
	 * In strict mode, all values must themselves be isEmpty().
	 * depth controls recursion (-1 = full recursion up to MAX_RECURSIVE_DEPTH).
	 */
	static isEmptyObject(test: unknown, strict = false, depth = -1): boolean | undefined {
		if (!TypeUtils.isObject(test)) return undefined
		if (depth === 0) return !strict

		const nextDepth = depth === -1 ? TypeUtils.MAX_RECURSIVE_DEPTH - 1 : depth - 1
		const keys = Object.keys(test as Record<string, unknown>)

		if (keys.length === 0) return true

		if (strict) {
			for (const key of keys) {
				if (!TypeUtils.isEmpty((test as Record<string, unknown>)[key], strict, nextDepth))
					return false
			}
			return true
		}

		return false
	}

	static isEmpty(test: unknown, strict = true, depth = -1): boolean | undefined {
		const type = TypeUtils.getType(test)

		switch (type) {
			case 'undefined':
			case 'null':
				return true
			case 'boolean':
			case 'number':
			case 'symbol':
				return false
			case 'string':
				return TypeUtils.isEmptyString(test, strict)
			case 'array':
				return TypeUtils.isEmptyArray(test, strict, depth)
			case 'object':
				return TypeUtils.isEmptyObject(test, strict, depth)
			default:
				return TypeUtils.isEmptyByProperty(test)
		}
	}

	static isEmptyByProperty(test: unknown): boolean {
		if (
			test != null &&
			typeof test === 'object' &&
			Object.prototype.hasOwnProperty.call(test, 'isEmpty')
		) {
			const val = (test as Record<string, unknown>)['isEmpty']
			return TypeUtils.isBoolean(val) && val === true
		}
		return false
	}
}

/* ##########################
  Named Exports
########################## */

const getType = TypeUtils.getType.bind(TypeUtils)
const getNativeType = TypeUtils.getNativeType.bind(TypeUtils)
const getObjectType = TypeUtils.getObjectType.bind(TypeUtils)

const isArray = TypeUtils.isArray
const isBoolean = TypeUtils.isBoolean
const isFunction = TypeUtils.isFunction
const isNumber = TypeUtils.isNumber
const isObject = TypeUtils.isObject
const isString = TypeUtils.isString
const isSymbol = TypeUtils.isSymbol

const isArgs = TypeUtils.isArgs
const isDate = TypeUtils.isDate
const isError = TypeUtils.isError
const isMap = TypeUtils.isMap
const isRegExp = TypeUtils.isRegExp
const isSet = TypeUtils.isSet
const isWeakMap = TypeUtils.isWeakMap

const isUndefined = TypeUtils.isUndefined
const isNull = TypeUtils.isNull

const hasLength = TypeUtils.hasLength

const isEmpty = TypeUtils.isEmpty.bind(TypeUtils)
const isEmptyString = TypeUtils.isEmptyString
const isEmptyArray = TypeUtils.isEmptyArray.bind(TypeUtils)
const isEmptyObject = TypeUtils.isEmptyObject.bind(TypeUtils)
const isEmptyByProperty = TypeUtils.isEmptyByProperty

export default TypeUtils
export {
	TypeUtils,
	getType,
	getNativeType,
	getObjectType,
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
	hasLength,
	isEmpty,
	isEmptyString,
	isEmptyArray,
	isEmptyObject,
	isEmptyByProperty,
}
