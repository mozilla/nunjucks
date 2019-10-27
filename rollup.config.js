import path from 'path';

import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import json from 'rollup-plugin-json';
import nodeGlobals from 'rollup-plugin-node-globals';
import nodeBuiltins from 'rollup-plugin-node-builtins';
import {terser} from 'rollup-plugin-terser';

import pjson from './package.json';

const isTest = (process.env.NODE_ENV === 'test');
const {plugins, presets: [[, envConfig]]} = pjson.babel;

export default ['umd', 'cjs', 'es'].map(format => ({
  treeshake: {
    moduleSideEffects: 'no-external',
  },
  plugins: [
    {
      resolveId(importee) {
        if (format === 'umd' && /^\.\/loaders$/.test(importee)) {
          return require.resolve('nunjucks/src/web-loaders');
        }
        return undefined;
      },
    },
    json(),
    babel({
      plugins: [
        ...((!isTest) ? [] : [['istanbul', {
          cwd: path.resolve('../..'),
        }]]),
        ...plugins,
      ],
      babelrc: false,
      sourceMaps: true,
      inputSourceMap: true,
      presets: [['@babel/env', {
        ...envConfig,
        modules: false,
        targets: (format === 'umd')
          ? {browsers: pjson.browserslist}
          : envConfig.targets,
      }]],
      runtimeHelpers: true,
      exclude: /node_modules/,
    }),
    (format === 'umd') ? commonjs({
      include: /node_modules/,
    }) : {},
    ...(
      (format !== 'umd') ? [] : [
        nodeGlobals({buffer: false}),
        nodeBuiltins(),
      ]),
    (format === 'umd') ? nodeResolve({
      preferBuiltins: (format !== 'umd'),
      browser: (format === 'umd'),
    }) : {},
    ...((format !== 'umd' || isTest) ? [] : [
      terser({
        sourcemap: true,
        toplevel: true,
        compress: {
          pure_getters: true,
          unsafe: true,
          unsafe_comps: true,
          warnings: false,
        },
        nameCache: {},
      }),
    ]),
  ].filter(Boolean)
}));
