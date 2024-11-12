var spawn = require('child_process').spawn;
var path = require('path');

var utils = require('./utils');
var lookup = utils.lookup;
var promiseSequence = utils.promiseSequence;

function mochaRun({cliTest = false} = {}) {
  // We need to run the cli test without nyc because of weird behavior
  // with spawn-wrap
  const bin = lookup((cliTest) ? '.bin/mocha' : '.bin/nyc', true);
  const runArgs = (cliTest)
    ? []
    : [
      '--exclude',
      'tests/**',
      '--silent',
      '--no-clean',
      require.resolve('mocha/bin/mocha'),
    ];

  const mochaArgs = (cliTest)
    ? ['tests/cli.js']
    : ['--grep', 'precompile cli', '--invert', 'tests'];

  return new Promise((resolve, reject) => {
    try {
      const proc = spawn(bin, [
        ...runArgs,
        '-R', 'spec',
        '-r', 'tests/setup',
        ...mochaArgs,
      ], {
        cwd: path.join(__dirname, '../..'),
        env: process.env
      });

      proc.stdout.pipe(process.stdout);
      proc.stderr.pipe(process.stderr);

      proc.on('error', (err) => reject(err));

      proc.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('test failed. nyc/mocha exit code: ' + code));
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

function runtests() {
  return new Promise((resolve, reject) => {
    const mochaPromise = promiseSequence([
      () => mochaRun({cliTest: false}),
      () => mochaRun({cliTest: true}),
    ]);

    return mochaPromise
      .then(() => resolve())
      .catch((err) => {
        reject(err);
      });
  });
}

module.exports = runtests;
