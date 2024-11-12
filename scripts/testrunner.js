#!/usr/bin/env node

'use strict';

var NYC = require('nyc');

process.env.NODE_ENV = 'test';

const nyc = new NYC({
  exclude: ['*.min.js', 'scripts/**', 'tests/**'],
  reporter: ['text', 'html', 'lcovonly'],
  showProcessTree: true
});
nyc.reset();

const runtests = require('./lib/runtests');

let err;

runtests()
  .catch((e) => {
    err = e;
    console.log(err); // eslint-disable-line no-console
  })
  .then(() => {
    nyc.writeCoverageFile();
    nyc.report();

    if (err) {
      process.exit(1);
    }
  });
