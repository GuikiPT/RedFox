module.exports = [
    {
        ignores: ['**/eslint.config.js', '**/node_modules/**', '**/dist/**'],
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },
        languageOptions: {
            parser: require('@typescript-eslint/parser'),
            parserOptions: {
                project: './tsconfig.json',
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
        },
        rules: {
            'no-unused-vars': 'off',
            'no-undef': 'off',
            '@typescript-eslint/func-names': 'off',
            'no-eval': 'error',
            '@typescript-eslint/no-invalid-this': 'error',
            'no-return-await': 'warn',
            '@typescript-eslint/no-var': 'off',
            '@typescript-eslint/require-await': 'error',
            'no-extra-semi': 'warn',
            'prefer-const': 'error',
            '@typescript-eslint/ban-ts-comment': 'off',
            'no-prototype-builtins': 'warn',
            '@typescript-eslint/no-unused-vars': 'error',
            '@typescript-eslint/no-explicit-any': 'error',
        },
    },
];
