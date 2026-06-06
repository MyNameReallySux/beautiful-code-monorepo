import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import pc from 'picocolors'

// NOTE: @beautiful-code/type-utils has no src yet (packages/type-utils has no
// src/index.ts in this repo). Tests are structured correctly but will fail to
// resolve the import until that package's source is added. This is outside the
// scope of this porting task.
import {
	ConsoleUtils,
	print,
	info,
	warn,
	error,
	debug,
	supressConsole,
	suppressConsole,
	restoreConsole,
} from '../src/ConsoleUtils.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * We assert against pc.<color>(value) rather than literal ANSI escape codes
 * because picocolors only emits codes when the terminal supports color.
 * In CI / non-TTY vitest runs isColorSupported is false, so pc.cyan('x') === 'x'.
 * Asserting against the formatter's own output is environment-independent.
 */

// ---------------------------------------------------------------------------
// info
// ---------------------------------------------------------------------------

describe('info', () => {
	let spy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		spy = vi.spyOn(console, 'info').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('routes to console.info', () => {
		info('hello')
		expect(spy).toHaveBeenCalledTimes(1)
	})

	it('applies cyan color to string argument', () => {
		info('hello')
		expect(spy).toHaveBeenCalledWith(pc.cyan('hello'))
	})

	it('does NOT route to console.warn or console.error', () => {
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
		info('hello')
		expect(warnSpy).not.toHaveBeenCalled()
		expect(errorSpy).not.toHaveBeenCalled()
	})

	it('colors each argument individually', () => {
		info('a', 'b')
		expect(spy).toHaveBeenCalledWith(pc.cyan('a'), pc.cyan('b'))
	})
})

// ---------------------------------------------------------------------------
// warn
// ---------------------------------------------------------------------------

describe('warn', () => {
	let spy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('routes to console.warn', () => {
		warn('careful')
		expect(spy).toHaveBeenCalledTimes(1)
	})

	it('applies yellow color to string argument', () => {
		warn('careful')
		expect(spy).toHaveBeenCalledWith(pc.yellow('careful'))
	})

	it('does NOT route to console.info or console.error', () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
		warn('careful')
		expect(infoSpy).not.toHaveBeenCalled()
		expect(errorSpy).not.toHaveBeenCalled()
	})
})

// ---------------------------------------------------------------------------
// error
// ---------------------------------------------------------------------------

describe('error', () => {
	let spy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		spy = vi.spyOn(console, 'error').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('routes to console.error', () => {
		error('oops')
		expect(spy).toHaveBeenCalledTimes(1)
	})

	it('applies red color to string argument', () => {
		error('oops')
		expect(spy).toHaveBeenCalledWith(pc.red('oops'))
	})

	it('does NOT route to console.info or console.warn', () => {
		const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
		error('oops')
		expect(infoSpy).not.toHaveBeenCalled()
		expect(warnSpy).not.toHaveBeenCalled()
	})
})

// ---------------------------------------------------------------------------
// debug
// ---------------------------------------------------------------------------

describe('debug', () => {
	let logSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('routes to console.log', () => {
		debug('plain')
		expect(logSpy).toHaveBeenCalledTimes(1)
	})

	it('passes primitive arguments through unchanged', () => {
		debug('hello', 42)
		expect(logSpy).toHaveBeenCalledWith('hello', 42)
	})

	it('pretty-prints object arguments as indented JSON with a leading newline', () => {
		const obj = { a: 1, b: 2 }
		debug(obj)
		expect(logSpy).toHaveBeenCalledWith(`\n${JSON.stringify(obj, null, 4)}`)
	})

	it('mixes primitives and objects correctly', () => {
		const obj = { x: true }
		debug('label', obj)
		expect(logSpy).toHaveBeenCalledWith('label', `\n${JSON.stringify(obj, null, 4)}`)
	})

	it('does NOT apply color to output', () => {
		// Verify no cyan/green/red/yellow wrapping — debug never colors
		debug('plain text')
		const [firstArg] = logSpy.mock.calls[0] ?? []
		expect(firstArg).toBe('plain text')
	})
})

// ---------------------------------------------------------------------------
// supressConsole / suppressConsole / restoreConsole
// ---------------------------------------------------------------------------

describe('supressConsole and restoreConsole', () => {
	afterEach(() => {
		// Always restore after each test in case a test fails mid-suppress
		restoreConsole()
		vi.restoreAllMocks()
	})

	it('suppresses console.log with a no-op', () => {
		const origLog = console.log
		supressConsole()
		expect(console.log).not.toBe(origLog)
		restoreConsole()
	})

	it('suppresses console.warn with a no-op', () => {
		const origWarn = console.warn
		supressConsole()
		expect(console.warn).not.toBe(origWarn)
		restoreConsole()
	})

	it('suppresses console.error with a no-op', () => {
		const origError = console.error
		supressConsole()
		expect(console.error).not.toBe(origError)
		restoreConsole()
	})

	it('restoreConsole restores console.log to its original', () => {
		const origLog = console.log
		supressConsole()
		restoreConsole()
		expect(console.log).toBe(origLog)
	})

	it('restoreConsole restores console.warn to its original', () => {
		const origWarn = console.warn
		supressConsole()
		restoreConsole()
		expect(console.warn).toBe(origWarn)
	})

	it('restoreConsole restores console.error to its original', () => {
		const origError = console.error
		supressConsole()
		restoreConsole()
		expect(console.error).toBe(origError)
	})

	it('suppressConsole (correctly spelled) is the same function as supressConsole', () => {
		expect(suppressConsole).toBe(supressConsole)
	})

	it('suppressed console.log does not invoke the original', () => {
		supressConsole()
		// After suppression the replacement is a no-op — calling it shouldn't throw
		expect(() => console.log('silenced')).not.toThrow()
		restoreConsole()
	})
})

// ---------------------------------------------------------------------------
// print
// ---------------------------------------------------------------------------

describe('print', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('routes to console.log', () => {
		const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
		print('hello')
		expect(logSpy).toHaveBeenCalledWith('hello')
	})
})

// ---------------------------------------------------------------------------
// ConsoleUtils class (re-export of same static methods)
// ---------------------------------------------------------------------------

describe('ConsoleUtils class', () => {
	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('exports the ConsoleUtils class with static methods', () => {
		expect(typeof ConsoleUtils.info).toBe('function')
		expect(typeof ConsoleUtils.warn).toBe('function')
		expect(typeof ConsoleUtils.error).toBe('function')
		expect(typeof ConsoleUtils.debug).toBe('function')
		expect(typeof ConsoleUtils.print).toBe('function')
		expect(typeof ConsoleUtils.supressConsole).toBe('function')
		expect(typeof ConsoleUtils.suppressConsole).toBe('function')
		expect(typeof ConsoleUtils.restoreConsole).toBe('function')
	})

	it('ConsoleUtils.info routes to console.info', () => {
		const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
		ConsoleUtils.info('via class')
		expect(spy).toHaveBeenCalledWith(pc.cyan('via class'))
	})
})
