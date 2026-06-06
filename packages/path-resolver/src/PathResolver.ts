import fs from 'node:fs'
import path from 'node:path'

import { print, warn } from '@beautiful-code/console-utils'
import { toCamelCase, toSnakeCase, toKebabCase } from '@beautiful-code/string-utils'
import { isBoolean, isFunction, isObject, isString } from '@beautiful-code/type-utils'

import { DuplicateKeyError, InvalidArgumentsError } from './errors.js'

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

/** Per-directory config object, placed at the `_` key inside any directory entry. */
export interface DirectoryConfig {
	/** Rename the resolver function for this directory (and its descendants use this as scope). */
	name?: string
	/** Rename the resolver and register it as an alias root (prefixed with @ or # in webpack/vite). */
	alias?: string
	/** Skip generating a resolver for this directory (children still processed). */
	ignore?: boolean
	/** Skip generating resolvers for this directory and all descendants. */
	ignoreBranch?: boolean
}

/** A single entry in the directory map: either a nested object with optional `_` config, or a string file path. */
export interface DirectoryMap {
	_?: DirectoryConfig
	[key: string]: DirectoryMap | string | DirectoryConfig | undefined
}

/** Options accepted by the PathResolver constructor. */
export interface PathResolverOptions {
	/** Property name on the instance that holds the directory resolver. @default 'paths' */
	namespace?: string
	/** Property name on the instance that holds the alias map. @default 'aliases' */
	aliasRoot?: string
	/** Property name on the instance that holds file entries. @default 'files' */
	fileRoot?: string
	/** Prefix for generated resolver function names. @default 'resolve' */
	resolverPrefix?: string
	/** Absolute root path all resolvers are relative to. @default fs.realpathSync(process.cwd()) */
	rootPath?: string
	/** The directory map. */
	paths?: DirectoryMap
	/** Whether to emit both an alias resolver AND a plain resolver when an alias is present. @default false */
	duplicateAliases?: boolean
	/** How many directory levels to process. -1 means unlimited. @default -1 */
	depth?: number
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type Resolver = (relativePath?: string) => string
type DirectoryResolverMap = Record<string, Resolver>
type AliasMap = Record<string, string>

// ---------------------------------------------------------------------------
// Internal helpers (Externals namespace, kept local)
// ---------------------------------------------------------------------------

function filterObject<T extends Record<string, unknown>>(object: T): Partial<T> {
	const result: Partial<T> = {}
	for (const key of Object.keys(object) as Array<keyof T>) {
		if (object[key] !== undefined) {
			result[key] = object[key]
		}
	}
	return result
}

function hasKeyAvailable(
	obj: Record<string, unknown>,
	key: string,
	onSuccess?: (result: true) => void,
	onError?: (result: false, e: unknown) => void,
): boolean {
	const contains = Object.prototype.hasOwnProperty.call(obj, key)
	try {
		if (contains) {
			throw new DuplicateKeyError(
				`The given object has duplicate keys '${key}'. Make sure all directories have unique key, or use scopes / aliases'`,
			)
		} else {
			if (isFunction(onSuccess)) onSuccess(true)
			return true
		}
	} catch (e) {
		if (isFunction(onError)) onError(false, e)
		return false
	}
}

function isFileURI(uri: string): boolean {
	const last = uri.split('/').pop() ?? ''
	return last.indexOf('.') > -1
}

// ---------------------------------------------------------------------------
// PathResolver class
// ---------------------------------------------------------------------------

/**
 * Generates a suite of relative-path resolver functions and a bundler alias map
 * from a declarative directory structure definition.
 */
class PathResolver {
	/**
	 * Default options applied when the caller omits individual fields.
	 */
	static defaultOptions: Required<PathResolverOptions> = {
		aliasRoot: 'aliases',
		depth: -1,
		duplicateAliases: false,
		fileRoot: 'files',
		namespace: 'paths',
		paths: {},
		resolverPrefix: 'resolve',
		rootPath: fs.realpathSync(process.cwd()),
	}

	/**
	 * Default per-directory config values.
	 */
	static defaultConfig: Required<DirectoryConfig> = {
		name: undefined as unknown as string,
		alias: undefined as unknown as string,
		ignore: false,
		ignoreBranch: false,
	}

	// Instance state set by initialize()
	options!: Required<PathResolverOptions>;
	// The directory resolver and alias map are stored at dynamic keys (namespace / aliasRoot),
	// so we keep typed handles here and also write them to `this[namespace]` / `this[aliasRoot]`.
	[key: string]: unknown

	// -----------------------------------------------------------------------
	// Construction
	// -----------------------------------------------------------------------

	/**
	 * @param paths Directory map (single-arg form).
	 */
	constructor(paths: DirectoryMap)
	/**
	 * @param paths Directory map.
	 * @param options Options object.
	 */
	constructor(paths: DirectoryMap, options: PathResolverOptions)
	/**
	 * @param rootPath Absolute root path.
	 * @param paths Directory map.
	 */
	constructor(rootPath: string, paths: DirectoryMap)
	/**
	 * @param rootPath Absolute root path.
	 * @param paths Directory map.
	 * @param options Options object.
	 */
	constructor(rootPath: string, paths: DirectoryMap, options: PathResolverOptions)
	/** Zero-arg form (deferred init). */
	constructor()
	constructor(...args: unknown[]) {
		this.initialize(...args)
	}

	// -----------------------------------------------------------------------
	// Public API
	// -----------------------------------------------------------------------

	getDirectoryResolver = (): DirectoryResolverMap => {
		const { namespace } = this.options
		return this[namespace] as DirectoryResolverMap
	}

	getAliasMap = (): AliasMap => {
		const { aliasRoot } = this.options
		return this[aliasRoot] as AliasMap
	}

	/**
	 * Configures the instance (can be called after construction to defer init).
	 */
	initialize = (...args: unknown[]): void => {
		this.options = this._handleArgs(...args)

		const { directoryResolver, aliasMap } = this._getInitialResolvers()
		// BUG FIX: original assigned result to `fullResolver` but never used it; removed.
		this._createResolver(directoryResolver, aliasMap)
	}

	/**
	 * Returns a function that resolves paths relative to `rootPath`.
	 *
	 * @example
	 * const resolve = makeRelativeResolver('/abs/path')
	 * resolve('index.html') // '/abs/path/index.html'
	 */
	makeRelativeResolver =
		(rootPath: string): Resolver =>
		(relativePath = '') =>
			path.resolve(rootPath, relativePath)

	toString = (): string => {
		const directoryResolver = this.getDirectoryResolver()
		const aliasMap = this.getAliasMap()

		const PADDING_SIZE = 24

		return `======================================
:: DIRECTORY RESOLVER ::

${'function'.padEnd(PADDING_SIZE)}\t ${'result'}
${'-----------------'.padEnd(PADDING_SIZE)}\t ------------------
${Object.entries(directoryResolver).reduce((str, [name, resolver], index, collection) => {
	const formatted = name.padEnd(PADDING_SIZE)
	const linebreak = index < collection.length - 1 ? '\n' : ''
	str += `${formatted} \t ${resolver()}${linebreak}`
	return str
}, '')}
======================================

:: ALIAS MAP ::

${'name'.padEnd(PADDING_SIZE)}\t ${'value'}
${'-----------------'.padEnd(PADDING_SIZE)}\t ------------------
${Object.entries(aliasMap).reduce((str, [alias, resolvedPath], index, collection) => {
	const formatted = alias.padEnd(PADDING_SIZE)
	const linebreak = index < collection.length - 1 ? '\n' : ''
	str += `${formatted} \t ${resolvedPath}${linebreak}`
	return str
}, '')}`
	}

	printDetails = (): void => print(this.toString())

	// -----------------------------------------------------------------------
	// Private helpers
	// -----------------------------------------------------------------------

	_addAlias = (key: string, resolvedPath: string, aliasMap: AliasMap): void => {
		if (hasKeyAvailable(aliasMap as Record<string, unknown>, key)) {
			aliasMap[key] = this.makeRelativeResolver(resolvedPath)()
		}
	}

	_addResolver = (key: string, resolvedPath: string, resolver: DirectoryResolverMap): void => {
		if (hasKeyAvailable(resolver as Record<string, unknown>, key)) {
			resolver[key] = this.makeRelativeResolver(resolvedPath)
		}
	}

	_createResolver = (directoryResolver: DirectoryResolverMap, aliasMap: AliasMap): void => {
		const { depth, duplicateAliases, paths, rootPath } = this.options

		const _handleRoot = (): void => {
			const localRootPath = this._formatPath(rootPath)

			const rootConfig = this._getConfig(paths) ?? {}
			const { alias, name } = rootConfig

			const localKey = name ?? ''
			const resolverKey = this._getDirectoryResolverKey(localKey, '')

			const aliasUsed = this._handleAlias(
				localKey,
				alias,
				localRootPath,
				directoryResolver,
				aliasMap,
			)
			const aliasIsNotUsed = duplicateAliases || !aliasUsed

			if (aliasIsNotUsed) {
				this._addResolver(resolverKey, localRootPath, directoryResolver)
			}
		}

		const _resolveLevel = ({
			localPaths,
			parentPath,
			scope,
			index = 0,
		}: {
			localPaths: DirectoryMap
			parentPath?: string
			scope?: string
			index?: number
		}): void => {
			const _handleStringValue = (value: string): string => {
				return this._formatPath(value, parentPath, rootPath)
			}

			const _handleObjectValue = (key: string, value: DirectoryMap): void => {
				const isConfig = key === '_'
				if (isConfig) return

				const localRootPath = this._formatPath(key, parentPath)
				const config = this._getConfig(value) ?? {}
				const { alias, name, ignore, ignoreBranch } = config

				if (ignoreBranch) return

				const aliasUsed = this._handleAlias(key, alias, localRootPath, directoryResolver, aliasMap)

				const localKey = name ?? key
				const nextScope = this._formatScope(localKey, scope)
				const resolverKey = this._getDirectoryResolverKey(localKey, scope)

				const isValidDepth = depth === -1 || index <= depth
				const duplicatesAreNotPresent = !Object.prototype.hasOwnProperty.call(
					directoryResolver,
					resolverKey,
				)
				const aliasIsNotUsed = duplicateAliases || !aliasUsed

				if (!ignore) {
					if (isValidDepth && duplicatesAreNotPresent && aliasIsNotUsed) {
						this._addResolver(resolverKey, localRootPath, directoryResolver)
					}
				}

				_resolveLevel({
					localPaths: value,
					parentPath: localRootPath,
					scope: nextScope,
					index: index + 1,
				})
			}

			for (const [key, value] of Object.entries(localPaths)) {
				if (isString(value) && isFileURI(value) && key !== '_') {
					// file entry — store the resolved path (not used for resolver functions)
					_handleStringValue(value)
				} else if (isObject(value)) {
					_handleObjectValue(key, value as DirectoryMap)
				}
			}
		}

		_handleRoot()
		_resolveLevel({ localPaths: paths })
	}

	_formatPath = (name: string, parentPath?: string, rootPath?: string): string => {
		if (parentPath && rootPath) {
			return path.resolve(rootPath, parentPath, name)
		} else if (parentPath ?? rootPath) {
			return path.resolve((parentPath ?? rootPath)!, name)
		} else {
			return name
		}
	}

	_formatResolverKey = (name: string): string =>
		toCamelCase(`${this.options.resolverPrefix}-${toSnakeCase(name.replace(/[/\\]/, '-'))}`)

	_formatScope = (name: string, scope?: string): string => (scope ? `${scope}-${name}` : name)

	_getConfig = (paths: DirectoryMap): DirectoryConfig | undefined =>
		paths._ as DirectoryConfig | undefined

	_getDirectoryResolverKey = (name = '', scope?: string): string => {
		const keyToResolve = scope && name ? `${scope}-${name}` : name
		return this._formatResolverKey(keyToResolve)
	}

	_getInitialResolvers = (): { directoryResolver: DirectoryResolverMap; aliasMap: AliasMap } => {
		const { aliasRoot, namespace } = this.options
		let directoryResolver: DirectoryResolverMap = {}
		let aliasMap: AliasMap = {}

		if (namespace) {
			this[namespace] = {}
			directoryResolver = this[namespace] as DirectoryResolverMap
		} else {
			warn("PathResolver's 'namespace' property was invalid.")
		}

		if (aliasRoot) {
			this[aliasRoot] = {}
			aliasMap = this[aliasRoot] as AliasMap
		} else {
			warn("PathResolver's 'aliasRoot' property was invalid.")
		}

		return { directoryResolver, aliasMap }
	}

	_handleAlias = (
		key: string,
		alias: string | undefined,
		resolvedPath: string,
		directoryResolver: DirectoryResolverMap,
		aliasMap: AliasMap,
	): boolean => {
		let aliasUsed = false
		if (alias) {
			const aliasKey = alias.replace(/(@|#)/g, '')
			// aliasScope is computed but used only implicitly through aliasMapKey
			const _aliasScope = toKebabCase(aliasKey)
			void _aliasScope
			const aliasMapKey = this._getDirectoryResolverKey(aliasKey)

			if (hasKeyAvailable(aliasMap as Record<string, unknown>, aliasMapKey)) {
				this._addResolver(aliasMapKey, resolvedPath, directoryResolver)
				this._addAlias(alias, resolvedPath, aliasMap)
				aliasUsed = true
			}
		}
		return aliasUsed
	}

	_handleArgs = (...args: unknown[]): Required<PathResolverOptions> => {
		let options: PathResolverOptions

		switch (args.length) {
			case 0: {
				warn(
					"A 'PathResolver' object was passed no initial arguments. Initialization must be done manually by running the 'initialize' function.",
				)
				options = {}
				break
			}
			case 1: {
				if (isObject(args[0])) {
					options = { paths: args[0] as DirectoryMap }
				} else {
					options = {}
				}
				break
			}
			case 2: {
				if (isObject(args[0]) && isObject(args[1])) {
					const second = args[1] as PathResolverOptions
					if (Object.prototype.hasOwnProperty.call(second, 'paths')) {
						warn(
							"PathResolver was passed a 'paths' argument and an options object with the 'paths' property. Will use 'paths' argument.",
						)
					}
					options = { ...second, paths: args[0] as DirectoryMap }
				} else if (isString(args[0]) && isObject(args[1])) {
					options = { rootPath: args[0], paths: args[1] as DirectoryMap }
				} else {
					options = {}
				}
				break
			}
			case 3: {
				const third = args[2] as PathResolverOptions
				if (Object.prototype.hasOwnProperty.call(third, 'rootPath')) {
					warn(
						"PathResolver was passed a 'rootPath' argument and an options object with the 'rootPath' property. Will use 'rootPath' argument.",
					)
				}
				if (Object.prototype.hasOwnProperty.call(third, 'paths')) {
					warn(
						"PathResolver was passed a 'paths' argument and an options object with the 'paths' property. Will use 'paths' argument.",
					)
				}
				options = {
					...third,
					rootPath: args[0] as string,
					paths: args[1] as DirectoryMap,
				}
				break
			}
			default: {
				throw new InvalidArgumentsError(
					`PathResolver accepts between 1-3 arguments, '${args.length}' found.`,
				)
			}
		}

		return this._validateOptions(options)
	}

	/**
	 * @deprecated since 0.1.1
	 */
	_hasAlias = (paths: DirectoryMap): boolean =>
		Object.prototype.hasOwnProperty.call(paths, '_') && !!paths._?.alias

	_hasConfig = (paths: DirectoryMap): boolean => Object.prototype.hasOwnProperty.call(paths, '_')

	/**
	 * @deprecated since 0.1.0
	 */
	_hasName = (paths: DirectoryMap): boolean =>
		Object.prototype.hasOwnProperty.call(paths, '_') && !!paths._?.name

	_validateOptions = (options: PathResolverOptions): Required<PathResolverOptions> => {
		// BUG FIX: original assigned `rootPath` into `resolverPrefix` (copy-paste bug).
		// Fixed to validate and use `resolverPrefix` correctly.
		const { duplicateAliases, namespace, rootPath, resolverPrefix, ...other } = options
		const validated = Object.assign(
			{},
			PathResolver.defaultOptions,
			filterObject({
				...other,
				duplicateAliases: isBoolean(duplicateAliases) ? duplicateAliases : undefined,
				namespace: isString(namespace) && namespace.trim().length > 0 ? namespace : undefined,
				rootPath: isString(rootPath) && rootPath.trim().length > 0 ? rootPath : undefined,
				resolverPrefix:
					isString(resolverPrefix) && resolverPrefix.trim().length > 0 ? resolverPrefix : undefined,
			} as Record<string, unknown>),
		) as Required<PathResolverOptions>

		return validated
	}
}

export default PathResolver
export { PathResolver }
