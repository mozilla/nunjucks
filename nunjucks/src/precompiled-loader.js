'use strict';

const Loader = require('./loader');
const path = require('path').posix;

class PrecompiledLoader extends Loader {
  constructor(compiledTemplates) {
    super();
    this.precompiled = compiledTemplates || {};
  }

  getSource(name) {
    if (this.precompiled[name]) {
      return {
        src: {
          type: 'code',
          obj: this.precompiled[name]
        },
        path: name
      };
    }
    return null;
  }

  resolve(from, to) {
    return path.normalize(path.dirname(from) + '/' + to);
  }
}

module.exports = {
  PrecompiledLoader: PrecompiledLoader,
};
