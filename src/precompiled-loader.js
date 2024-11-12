'use strict';

const Loader = require('./loader');

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
}

module.exports = {
  PrecompiledLoader: PrecompiledLoader,
};
