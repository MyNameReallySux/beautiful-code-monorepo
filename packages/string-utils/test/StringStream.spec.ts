import { describe, it, expect, beforeEach } from 'vitest'

import { StringStream } from '../src/StringStream'

describe('StringStream', () => {
	describe('#stream', () => {
		describe('handles complex string transformations', () => {
			let stream: StringStream
			beforeEach(() => {
				stream = StringStream.stream('this is a string')
			})
			it(`#toCamelCase -> #capitalize`, () =>
				expect(stream.toCamelCase().capitalize().get()).toBe(`ThisIsAString`))
			it(`#toSnakeCase -> #capitalize`, () =>
				expect(stream.toSnakeCase().capitalize().get()).toBe(`This_is_a_string`))
			it(`#toKebabCase -> #capitalize`, () =>
				expect(stream.toKebabCase().capitalize().get()).toBe(`This-is-a-string`))
		})
	})
})
