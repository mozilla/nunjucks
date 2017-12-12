module.exports = {
  'extends': 'eslint:recommended',
    'parserOptions': {
      'sourceType': 'module',
      'ecmaVersion': 2017
  },
  'env': {
    'node': true,
    'es6': true,
    'mocha': true,
    'browser': true
  },
  'rules': {
    'indent': ['error', 2, { 'SwitchCase': 1 }],
    'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
    'semi': [2, 'always'],
    'brace-style': ['error', '1tbs'],
    'comma-style': ['error', 'last'],
    'comma-spacing': ['error', {'after': true, 'before': false}],
    'eol-last': ['error', 'always'],
    'func-call-spacing': ['error', 'never'],
    'semi-spacing': ['error', {'before': false, 'after': true}],
    'keyword-spacing': ['error', {'before': true, 'after': true}],
    'no-useless-escape': 'off',
    'no-constant-condition': 'off'
  },
  'globals': {
    'nunjucks': false
  }
};
