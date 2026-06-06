export class DuplicateKeyError extends Error {
	constructor(...args: ConstructorParameters<typeof Error>) {
		super(...args)
		this.name = 'DuplicateKeyError'
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, DuplicateKeyError)
		}
	}
}

export class InvalidArgumentsError extends Error {
	constructor(...args: ConstructorParameters<typeof Error>) {
		super(...args)
		this.name = 'InvalidArgumentsError'
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, InvalidArgumentsError)
		}
	}
}
