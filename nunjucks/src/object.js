'use strict';

// A simple class system, more documentation to come
const lib = require('./lib');

function parentWrap(parent, prop) {
  if (typeof parent !== 'function' || typeof prop !== 'function') {
    return prop;
  }
  return function wrap() {
    // Save the current parent method
    const tmp = this.parent;

    // Set parent to the previous method, call, and restore
    this.parent = parent;
    const res = prop.apply(this, arguments);
    this.parent = tmp;

    return res;
  };
}

function extendClass(cls, name, props) {
  props = props || {};

  lib.keys(props).forEach(k => {
    props[k] = parentWrap(cls.prototype[k], props[k]);
  });

  class subclass extends cls {
    get typename() {
      return name;
    }
  }

  lib._assign(subclass.prototype, props);

  return subclass;
}

class Obj {
  constructor(...args) {
    // Unfortunately necessary for backwards compatibility
    this.init(...args);
  }

  init() {}

  get typename() {
    return this.constructor.name;
  }

  static extend(name, props) {
    if (typeof name === 'object') {
      props = name;
      name = 'anonymous';
    }
    return extendClass(this, name, props);
  }
}

module.exports = Obj;
