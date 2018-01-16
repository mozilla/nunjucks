#!/usr/bin/env node
var NYC = require('nyc');

process.env.NODE_ENV = 'test';

var nyc = new NYC({
  exclude: ['*.min.js', 'scripts/**', 'tests/**'],
  reporter: ['text', 'html'],
  showProcessTree: true
});
nyc.reset();

require('babel-register');

var runtests = require('./lib/runtests');
var precompileTestTemplates = require('./lib/precompile');

var err;

precompileTestTemplates().then(function() {
  return runtests();
}).catch(function(e) {
  err = e;
  console.log(err);  // eslint-disable-line no-console
}).then(function() {
  nyc.writeCoverageFile();
  nyc.report();

  if (err) {
    process.exit(1);
  }
});
