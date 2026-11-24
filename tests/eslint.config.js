const { defineConfig, globalIgnores } = require("eslint/config");

const globals = require("globals");
const js = require("@eslint/js");

module.exports = defineConfig([
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.mocha,
        ...globals.browser,
        nunjucks: false,
      },
    },

    rules: {
      "func-names": "off",
      "global-require": "off",

      "spaced-comment": [
        "error",
        "always",
        {
          exceptions: ["*", ","],
        },
      ],

      "one-var": "off",
      "one-var-declaration-per-line": "off",
      "no-restricted-syntax": "off",
      "no-redeclare": ["error", { builtinGlobals: false }],
      "no-shadow": "error",
      "no-unused-vars": [
        "error",
        {
          args: "none",
          caughtErrors: "none",
        },
      ],
      "no-eval": "error",
      "vars-on-top": "error",
      "no-array-constructor": "error",
      "no-new-wrappers": "error",
      "consistent-return": "error",
    },
  },
  globalIgnores(["**/express-sample/*", "**/express/*", "**/browser/*"]),
]);
