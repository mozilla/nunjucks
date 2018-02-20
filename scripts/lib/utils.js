'use strict';

var fs = require('fs');
var path = require('path');

function lookup(relPath, isExecutable) {
  for (let i = 0; i < module.paths.length; i++) {
    let absPath = path.join(module.paths[i], relPath);
    if (isExecutable && process.platform === 'win32') {
      absPath += '.cmd';
    }
    if (fs.existsSync(absPath)) {
      return absPath;
    }
  }
  return undefined;
}

function promiseSequence(promises) {
  return new Promise((resolve, reject) => {
    var results = [];

    function iterator(prev, curr) {
      return prev.then((result) => {
        results.push(result);
        return curr(result, results);
      }).catch((err) => {
        reject(err);
      });
    }

    promises.push(() => Promise.resolve());
    promises.reduce(iterator, Promise.resolve(false)).then((res) => resolve(res));
  });
}

module.exports = {
  lookup: lookup,
  promiseSequence: promiseSequence
};
