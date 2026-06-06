import pc from 'picocolors'
import { isObject } from '@beautiful-code/type-utils'

// Capture originals at module load for restore. These are the true originals,
// not the vitest-spy-wrapped versions, so restoreConsole always goes back to
// the pre-spy state.
const CONSOLE_LOG = console.log
const CONSOLE_WARN = console.warn
const CONSOLE_ERROR = console.error

/**
 * Apply a picocolors formatter to each argument in an args array.
 * picocolors formatters accept string|number|null|undefined (not unknown),
 * so we coerce unknown values via String() unless they're already compatible.
 *
 * BEHAVIOR CHANGE vs old source: old code called `colors.info(...args)` which
 * only colored args[0] via the spread (colors/safe spread behavior). Here we
 * explicitly color each argument individually before passing them to console,
 * so every argument is colored — not just the first.
 */
function colorizeArgs(
	formatter: (input: string | number | null | undefined) => string,
	args: unknown[],
): unknown[] {
	return args.map((arg) => {
		if (typeof arg === 'string' || typeof arg === 'number' || arg === null || arg === undefined) {
			return formatter(arg)
		}
		return formatter(String(arg))
	})
}

export class ConsoleUtils {
	static readonly CONSOLE_LOG = CONSOLE_LOG
	static readonly CONSOLE_WARN = CONSOLE_WARN
	static readonly CONSOLE_ERROR = CONSOLE_ERROR

	/**
	 * Plain console.log pass-through. Implemented as a wrapper (not a direct
	 * reference) so suppression affects it.
	 *
	 * BEHAVIOR CHANGE vs old source: old `print = console.log` was captured by
	 * reference at class definition time, bypassing suppression. This wrapper
	 * delegates dynamically so it is affected by suppressConsole/restoreConsole.
	 */
	static print = (...args: unknown[]): void => {
		console.log(...args)
	}

	static info = (...args: unknown[]): void => {
		console.info(...colorizeArgs(pc.cyan, args))
	}

	static warn = (...args: unknown[]): void => {
		console.warn(...colorizeArgs(pc.yellow, args))
	}

	static error = (...args: unknown[]): void => {
		console.error(...colorizeArgs(pc.red, args))
	}

	/**
	 * Debug logger. Object arguments are pretty-printed as indented JSON
	 * (with a leading newline). Primitive arguments pass through unchanged.
	 * No color is applied — the old theme registered debug:'green' but debug()
	 * never used it, only pretty-printing.
	 *
	 * NOTE: The old LEVELS/level guard was removed (see deliberate redesign).
	 * debug() always logs.
	 */
	static debug = (...args: unknown[]): void => {
		const mapped = args.map((arg) => (isObject(arg) ? `\n${JSON.stringify(arg, null, 4)}` : arg))
		console.log(...mapped)
	}

	/**
	 * Suppress all console output by replacing log/warn/error with no-ops.
	 * Original misspelling kept as primary name; suppressConsole is the
	 * correctly-spelled alias added for forward compatibility.
	 */
	static supressConsole = (): void => {
		console.log = () => {}
		console.warn = () => {}
		console.error = () => {}
	}

	static suppressConsole = ConsoleUtils.supressConsole

	static restoreConsole = (): void => {
		console.log = CONSOLE_LOG
		console.warn = CONSOLE_WARN
		console.error = CONSOLE_ERROR
	}
}

export const print = ConsoleUtils.print
export const info = ConsoleUtils.info
export const warn = ConsoleUtils.warn
export const error = ConsoleUtils.error
export const debug = ConsoleUtils.debug

export const supressConsole = ConsoleUtils.supressConsole
/** Correctly-spelled alias for supressConsole (added for forward compatibility). */
export const suppressConsole = ConsoleUtils.suppressConsole
export const restoreConsole = ConsoleUtils.restoreConsole
