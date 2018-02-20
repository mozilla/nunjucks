module.exports = {
  'env': {
    node: true,
    es6: false,
    mocha: true,
    browser: true,
  },
  'rules': {
    // func-names is annoying when you don't have arrow syntax
    'func-names': 'off',
    // To deal with browser environments, we need to have require
    // calls inside a conditional
    'global-require': 'off',
    'spaced-comment': ['error', 'always', { 'exceptions': ['*', ','] }],
    // This is another rule that doesn't make sense when you don't have block-level
    // variable declarations
    'one-var': 'off',
    'one-var-declaration-per-line': 'off',
    // We need tests to run without babel on browsers that might not have Object.keys
    // and related functions
    'no-restricted-syntax': 'off',
  },
};
