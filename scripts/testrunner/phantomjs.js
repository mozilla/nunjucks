'use strict';

const path = require('path');
const {spawn} = require('child_process');
const {lookup} = require('./utils');

module.exports = function mochaPhantomJS(url, options) {
  options = options || {};

  return new Promise((resolve, reject) => {
    try {
      const args = [
        require.resolve('mocha-phantomjs-core'),
        url,
        'spec',
        JSON.stringify(Object.assign({
          useColors: true,
          hooks: 'mocha-phantomjs-istanbul',
          coverageFile: options.coverageFile,
        }, options.phantomjs || {})),
      ];
      const phantomjsPath = lookup('.bin/phantomjs', true) || lookup('phantomjs-prebuilt/bin/phantomjs', true);

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
