import rollupConfigBase from '../../rollup.config';

import pjson from './package.json';

const pjsonOutputFiles = {
  umd: 'browser',
  cjs: 'main',
  es: 'module',
};
const isTest = process.env.NODE_ENV === 'test';

export default ['umd', 'cjs', 'es', 'slim'].map((format, i) => {
  if (isTest && format === 'es') {
    return;
  }

  const base = rollupConfigBase[i % 3];
  const outputFormat = (format === 'slim') ? 'umd' : format;
  const isBrowser = (outputFormat === 'umd');
  const {name} = pjson;

  let file = pjson[pjsonOutputFiles[outputFormat]];

  if (format === 'slim') {
    file = file.replace('.min.js', '.slim.min.js');
  }

  if (isTest) {
    file = file.replace('dist/', 'test/');
  }

  const external = (isBrowser || isTest)
    ? []
    : Object.keys(pjson.dependencies || {});

  let input;
  if (format === 'umd') {
    input = 'src/browser.js';
  } else if (format === 'slim') {
    input = 'src/slim.js';
  } else {
    input = 'src/index.js';
  }

  return {
    ...base,
    external,
    input,
    output: {
      format: outputFormat,
      file,
      name,
      sourcemap: true,
    },
  };
}).filter(Boolean);
