if (!global.structuredClone) {
  global.structuredClone = function structuredClone(val) {
    return JSON.parse(JSON.stringify(val));
  };
}

const { defineConfig, globalIgnores } = require('eslint/config');
const { configs } = require('eslint-config-airbnb-extended/legacy');

const globals = require('globals');

module.exports = defineConfig([
  configs.base.legacy
    .concat([
      {
        languageOptions: {
          sourceType: 'module',
          ecmaVersion: 2017,
          parserOptions: {},

          globals: Object.assign({}, globals.node, { nunjucks: false }),
        },

        rules: {
          'space-before-function-paren': [
            'error',
            {
              anonymous: 'never',
              named: 'never',
              asyncArrow: 'always',
            },
          ],

          'no-use-before-define': 'off',
          'no-cond-assign': ['error', 'except-parens'],

          'no-unused-vars': [
            'error',
            {
              args: 'none',
              caughtErrors: 'none',
            },
          ],

          'no-underscore-dangle': 'off',
          'no-param-reassign': 'off',
          'class-methods-use-this': 'off',
          'function-paren-newline': 'off',
          'no-plusplus': 'off',
          'object-curly-spacing': 'off',
          'no-multi-assign': 'off',
          'no-else-return': 'off',
          'no-useless-escape': 'off',
          'comma-dangle': 'off',
          'prefer-exponentiation-operator': 'off',
          strict: 'off',
          'max-classes-per-file': 'off',
          'operator-linebreak': 'off',
        },
      },
    ])
    .concat(
      globalIgnores([
        '**/node_modules',
        '**/spm_modules',
        '**/coverage',
        '**/dist',
        '**/browser',
        '**/docs',
        'tests/express-sample',
        'tests/express',
        'tests/browser',
        '**/bench',
        '**/src',
      ])
    ),
]);
