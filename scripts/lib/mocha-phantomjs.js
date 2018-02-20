'use strict';

var spawn = require('child_process').spawn;
var path = require('path');
var lookup = require('./utils').lookup;

module.exports = function mochaPhantomJS(url, options) {
  options = options || {};
  const coverageFile = path.join(
    __dirname, '../../.nyc_output',
    (url.indexOf('slim') > -1) ? 'browser-slim.json' : 'browser-std.json');

  return new Promise((resolve, reject) => {
    try {
      const scriptPath = require.resolve('mocha-phantomjs-core/mocha-phantomjs-core.js');

      if (!scriptPath) {
        throw new Error('mocha-phantomjs-core.js not found');
      }

      const args = [
        scriptPath,
        url,
        options.reporter || 'dot',
        JSON.stringify(Object.assign({
          useColors: true,
          hooks: 'mocha-phantomjs-istanbul',
          coverageFile: coverageFile,
        }, options.phantomjs || {})),
      ];
      const phantomjsPath = lookup('.bin/phantomjs', true) || lookup('phantomjs-prebuilt/bin/phantomjs', true);

      if (!phantomjsPath) {
        throw new Error('PhantomJS not found');
      }

      const proc = spawn(phantomjsPath, args, {cwd: path.join(__dirname, '../..')});

      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);

      proc.on('error', (err) => {
        reject(err);
      });

      proc.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('test failed. phantomjs exit code: ' + code));
        }
      });
    } catch (err) {
      reject(err);
    }
  });
};
