import rollupConfigBase from '../../rollup.config';

import pjson from './package.json';

const pjsonOutputFiles = {
  umd: pjson.browser,
  cjs: pjson.main,
  es: pjson.module,
};
const isTest = process.env.NODE_ENV === 'test';
const {name} = pjson;

export default rollupConfigBase.map(base => {
  const {output: {format}} = base;
  const isBrowser = (format === 'umd');

  if (isTest && format === 'es') {
    return;
  }

  let file = pjsonOutputFiles[format];

  if (isTest) {
    file = file.replace('dist/', 'test/');
  }

  const external = (isBrowser || isTest) ? []
    : Object.keys(pjson.dependencies || {});

  const input = 'src/index.js';

  return {
    ...base,
    external,
    input,
    output: {
      format,
      file,
      name,
      sourcemap: true,
    },
  };
}).filter(Boolean);
//
// export default ['umd', 'cjs', 'es'].map((format, i) => {
//   if (isTest && format === 'es') {
//     return;
//   }
//
//   const base = rollupConfigBase[i];
//   const isBrowser = (format === 'umd');
//   const {name} = pjson;
//
//   let file = pjson[pjsonOutputFiles[format]];
//
//   if (format === 'slim') {
//     file = file.replace('.min.js', '.slim.min.js');
//   }
//
//   if (isTest) {
//     file = file.replace('dist/', 'test/');
//   }
//
//   const external = (isBrowser || isTest)
//     ? []
//     : Object.keys(pjson.dependencies || {});
//
//   const input = 'src/index.js';
//
//   return {
//     ...base,
//     external,
//     input,
//     output: {
//       format: format,
//       file,
//       name,
//       sourcemap: true,
//     },
//   };
// }).filter(Boolean);
