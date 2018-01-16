'use strict';

var spawn = require('child_process').spawn;
var path = require('path');
var lookup = require('./utils').lookup;

module.exports = function mochaPhantomJS(url, options) {
  options = options || {};
  var coverageFile = path.join(
    __dirname, '../../.nyc_output',
    (url.indexOf('slim') > -1) ? 'browser-slim.json' : 'browser-std.json');

  return new Promise(function(resolve, reject) {
    try {
      var scriptPath = require.resolve('mocha-phantomjs-core/mocha-phantomjs-core.js');

      if (!scriptPath) {
        throw new Error('mocha-phantomjs-core.js not found');
      }

      var args = [
        scriptPath,
        url,
        options.reporter || 'dot',
        JSON.stringify(Object.assign({
          useColors: true,
          hooks: 'mocha-phantomjs-istanbul',
          coverageFile: coverageFile,
        }, options.phantomjs || {})),
      ];
      var phantomjsPath = lookup('.bin/phantomjs', true) || lookup('phantomjs-prebuilt/bin/phantomjs', true);

      if (!phantomjsPath) {
        throw new Error('PhantomJS not found');
      }

      var proc = spawn(phantomjsPath, args, {cwd: path.join(__dirname, '../..')});

      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);

      proc.on('error', function (err) {
        reject(err);
      });

      proc.on('exit', function (code) {
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
