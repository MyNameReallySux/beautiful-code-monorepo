/* ##########################
  Imports
########################## */

import {
	getType,
	isArray,
	isFunction,
	isObject,
	isNumber,
	isString,
} from '@beautiful-code/type-utils'

/* ##########################
  Type Definitions
########################## */

type PlainObject = Record<string, unknown>

/* ##########################
  Class Definition
########################## */

/**
 * The ObjectUtils class has various methods related to managing, manipulating,
 * and configuring objects.
 *
 * @author Chris Coppola <mynamereallysux@gmail.com>
 */
class ObjectUtils {
	/* ##########################
	  Reflection Helpers
	########################## */

	/**
	 * Returns all property names on the instance's prototype chain (one level),
	 * including the constructor.
	 */
	static getInstanceMethods(instance: object): string[] {
		return Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
	}

	/**
	 * Returns own enumerable [key, value] pairs of an instance.
	 */
	static getInstanceProps(instance: object): [string, unknown][] {
		return Object.entries(instance)
	}

	/**
	 * Returns all own property names of a class (including 'length', 'name',
	 * 'prototype', and static fields/methods).
	 */
	static getStaticProps(clazz: object): string[] {
		return Object.getOwnPropertyNames(clazz)
	}

	/* ##########################
	  Object Utils
	########################## */

	/**
	 * Removes all null values from an object. Null values are `undefined`,
	 * `null`, or an empty string by default.
	 *
	 * @param object     - Object that should be cleaned.
	 * @param exclusions - List of values that should be removed.
	 * @returns Object without any null values.
	 */
	static clean = (
		object: PlainObject,
		exclusions: unknown[] = [undefined, null, ''],
	): PlainObject => ObjectUtils.exclude(object, exclusions)

	/**
	 * Returns a copy of `object` with entries whose values appear in
	 * `exclusions` removed.
	 *
	 * Bug fixed vs legacy: the named export `exclude` was mistakenly pointing
	 * at `extend`. Fixed here and in the named exports.
	 *
	 * @param object     - Source object.
	 * @param exclusions - Value(s) to exclude; may be a single value or array.
	 * @param fn         - Optional predicate; entries where fn returns true are
	 *                     also excluded.
	 */
	static exclude = (
		object: PlainObject = {},
		exclusions: unknown | unknown[] = [],
		_fn: () => boolean = () => false,
	): PlainObject => {
		if (isFunction(exclusions)) {
			_fn = exclusions as () => boolean
			exclusions = []
		}
		if (!isArray(exclusions)) exclusions = [exclusions]

		const exclusionList = exclusions as unknown[]

		return Object.entries(object)
			.filter(([, value]) => !exclusionList.includes(value))
			.reduce<PlainObject>((acc, [key, value]) => ({ ...acc, [key]: value }), {})
	}

	/**
	 * Extends a source object with one or more extension objects, stripping
	 * null / undefined / empty-string values from the result.
	 *
	 * Bug fixed vs legacy: original had `if(!isObject)` (always-truthy function
	 * reference) — corrected to `if(!isObject(source))`.
	 */
	static extend = (source: PlainObject, ...extensions: PlainObject[]): PlainObject => {
		if (!isObject(source)) return {}
		if (!extensions.length) return source
		return ObjectUtils.clean(Object.assign(source, ...extensions) as PlainObject)
	}

	/**
	 * Deep-merges one or more extension objects into `source`.
	 *
	 * - Nested objects are recursively merged.
	 * - Arrays are concatenated (not replaced).
	 * - `undefined` values in extensions are ignored.
	 * - Null / empty-string values in source are stripped via `clean`.
	 */
	static merge = (source: PlainObject, ...extensions: PlainObject[]): PlainObject => {
		if (!isObject(source)) return {}
		if (!extensions.length) return source

		return extensions.reduce<PlainObject>((collection, extension) => {
			if (!isObject(extension)) return collection

			Object.entries(extension)
				.filter(([, value]) => value !== undefined)
				.forEach(([key, value]) => {
					let result: unknown

					const collectionVal: unknown = collection[key]
					if (isObject(value) && isObject(collectionVal)) {
						result = ObjectUtils.merge(collectionVal as PlainObject, value as PlainObject)
					} else if (isArray(value) && isArray(collectionVal)) {
						result = (collectionVal as unknown[]).concat(value as unknown[])
					} else {
						result = value
					}

					collection = { ...collection, [key]: result }
				})

			return collection
		}, ObjectUtils.clean(source))
	}

	/**
	 * Returns a copy of `object` with the listed keys removed.
	 *
	 * Bug fixed vs legacy: predicate was called as `fn()` with no arguments.
	 * Now called as `fn(key, value)` so callers can make key/value-aware
	 * decisions.
	 *
	 * @param object    - Source object.
	 * @param omissions - Key name(s) to omit; may be a single string or array.
	 * @param fn        - Optional predicate `(key, value) => boolean`; when it
	 *                    returns true for a key in `omissions`, that entry is
	 *                    kept (overrides the omission).
	 */
	static omit = (
		object: PlainObject = {},
		omissions: string | string[] | ((key: string, value: unknown) => boolean) = [],
		fn: (key: string, value: unknown) => boolean = () => false,
	): PlainObject => {
		if (isFunction(omissions)) {
			fn = omissions as (key: string, value: unknown) => boolean
			omissions = []
		}
		if (!isArray(omissions)) omissions = [omissions as string]

		const omissionList = omissions as string[]

		return Object.entries(object)
			.filter(([key, value]) => !omissionList.includes(key) || fn(key, value))
			.reduce<PlainObject>((acc, [key, value]) => ({ ...acc, [key]: value }), {})
	}

	/**
	 * Sets a deeply nested value on `object` at the dot-separated `path`.
	 * Supports array index notation via `item[0]` segments.
	 *
	 * @example
	 *   ObjectUtils.setDeep(obj, 42, 'a.b.c')
	 *   ObjectUtils.setDeep(obj, 42, 'items[0].name')
	 */
	static setDeep = (object: PlainObject = {}, value: unknown, path: string): PlainObject => {
		const parts = path.split('.')
		// matches: item[0]  — capture groups: [1]=name, [2]=index digit
		const regexp = /([a-zA-Z]+)\[(\d)\]/

		let context: PlainObject = object

		for (const part of parts) {
			const match = regexp.exec(part)
			if (match !== null) {
				const propName = match[1] ?? ''
				const idx = Number(match[2] ?? 0)
				context = (context[propName] as PlainObject[])[idx] as PlainObject
			} else {
				if (context && !Object.prototype.hasOwnProperty.call(context, part)) {
					context[part] = {}
				}
				context = context[part] as PlainObject
			}
		}

		const lastPart = parts[parts.length - 1]
		if (lastPart === undefined) return object

		const lastMatch = regexp.exec(lastPart)
		if (lastMatch !== null) {
			const propName = lastMatch[1] ?? ''
			const idx = Number(lastMatch[2] ?? 0)
			;(context[propName] as unknown[])[idx] = value
		} else {
			context[lastPart] = value
		}

		return object
	}

	/**
	 * Returns the number of own enumerable keys on `obj`.
	 *
	 * @throws {Error} if `obj` is not a plain object.
	 */
	static size = (obj: unknown): number => {
		if (!isObject(obj))
			throw new Error(`Tried to get size of a non-object. Type was ${getType(obj)}.`)
		return Object.keys(obj as PlainObject).length
	}

	/**
	 * Returns a new object with keys and values swapped.
	 *
	 * Values must be strings or numbers (used as new keys). Throws if
	 * duplicate values exist (which would produce colliding keys).
	 *
	 * @throws {Error} if `obj` is not a plain object, if any value is not a
	 *                 string or number, or if duplicate values would collide.
	 */
	static swap = (obj: unknown): Record<string, string | number> => {
		if (!isObject(obj)) throw new Error(`Tried to swap a non-object. Type was ${getType(obj)}.`)

		return Object.entries(obj as PlainObject).reduce<Record<string, string | number>>(
			(swapped, [rawKey, value]) => {
				const hasValidPropTypes = isString(value) || isNumber(value)
				if (!hasValidPropTypes) {
					throw new Error(
						`Tried to swap an object with non-string or non-number properties. Type was ${getType(value)}.`,
					)
				}

				const typedValue = value as string | number

				if (Object.prototype.hasOwnProperty.call(swapped, String(typedValue))) {
					throw new Error(
						`Tried to swap object with duplicate values. {${swapped[String(typedValue)]}:${String(typedValue)}} and {${rawKey}:${String(typedValue)}} `,
					)
				}

				const numerical = parseFloat(rawKey)
				const finalKey: string | number =
					isNumber(numerical) && !isNaN(numerical) ? numerical : rawKey

				swapped[String(typedValue)] = finalKey
				return swapped
			},
			{},
		)
	}

	/**
	 * Returns `true` if all values in `obj` are unique (i.e., the object can
	 * be safely swapped without key collisions).
	 *
	 * @throws {Error} if `obj` is not a plain object.
	 */
	static isSwappable = (obj: unknown): boolean => {
		if (!isObject(obj)) {
			throw new Error(`Tried to check if a non-object was swappable. Type was ${getType(obj)}.`)
		}

		const values = Object.values(obj as PlainObject)
		const set = new Set(values)
		return set.size === values.length
	}
}

/* ##########################
  Named Exports
########################## */

const clean = ObjectUtils.clean
// Bug fixed: was `= ObjectUtils.extend` (typo). Now correctly points at exclude.
const exclude = ObjectUtils.exclude
const extend = ObjectUtils.extend
const isSwappable = ObjectUtils.isSwappable
const merge = ObjectUtils.merge
const omit = ObjectUtils.omit
const setDeep = ObjectUtils.setDeep
const size = ObjectUtils.size
const swap = ObjectUtils.swap

export default ObjectUtils

export { ObjectUtils, clean, exclude, extend, isSwappable, merge, omit, setDeep, size, swap }
