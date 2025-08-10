module.exports = {
  root: true,
  env: {
    es2021: true,
    node: true
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'script'
  },
  extends: [
    'eslint:recommended',
    'google'
  ],
  rules: {
    'max-len': ['error', { 'code': 120, 'ignoreStrings': true, 'ignoreTemplateLiterals': true }],
    'object-curly-spacing': 'off',
    'quote-props': 'off',
    'comma-dangle': 'off'
  },
  overrides: [
    {
      files: ['**/*.spec.*'],
      env: { mocha: true }
    }
  ]
};
