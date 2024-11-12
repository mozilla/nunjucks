'use strict';

const path = require('path');
const {EmitterObj} = require('./object');

module.exports = class Loader extends EmitterObj {
  resolve(from, to) {
    return path.resolve(path.dirname(from), to);
  }

  isRelative(filename) {
    return (filename.indexOf('./') === 0 || filename.indexOf('../') === 0);
  }
};
