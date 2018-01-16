'use strict';

var fs = require('fs');

function lookup(path, isExecutable) {
  for (var i = 0; i < module.paths.length; i++) {
    var absPath = require('path').join(module.paths[i], path);
    if (isExecutable && process.platform === 'win32') {
      absPath += '.cmd';
    }
    if (fs.existsSync(absPath)) {
      return absPath;
    }
  }
}

function promiseSequence(promises) {
  return new Promise(function(resolve, reject) {
    var results = [];

    function iterator(prev, curr) {
      return prev.then(function(result) {
        results.push(result);
        return curr(result, results);
      }).catch(function(err) {
        reject(err);
      });
    }

    promises.push(function() {
      return Promise.resolve();
    });
    promises.reduce(iterator, Promise.resolve(false)).then(function(res) {
      return resolve(res);
    });
  });
}

module.exports = {
  lookup: lookup,
  promiseSequence: promiseSequence
};
