// @ts-check
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
	{ ignores: ['**/dist/**', '**/node_modules/**', '.changeset/**'] },
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		rules: {
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		},
	},
	{
		files: ['**/*.spec.ts', '**/test/**'],
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			// tests construct `arguments` objects on purpose (TypeUtils.isArgs)
			'prefer-rest-params': 'off',
		},
	},
)
