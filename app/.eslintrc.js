module.exports = {
  root: true,
  extends: ['@react-native-community', 'prettier'],
  globals: {
    fetch: false,
    Headers: false,
  },
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'no-duplicate-imports': 'error',
    'no-shadow': 'off',
    'react/no-did-update-set-state': 'off',
    'object-curly-spacing': ['error', 'always'],
    quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: false }],
    // 'jsx-closing-bracket-location': [1, 'line-aligned'],
    curly: ['error', 'multi-line'],
    'comma-dangle': ['error', 'only-multiline'],
    'max-len': ['error', { code: 150, ignoreUrls: true }],
  },
};
