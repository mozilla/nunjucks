'use strict';

var ArrayProto = Array.prototype;
var ObjProto = Object.prototype;

var escapeMap = {
  '&': '&amp;',
  '"': '&quot;',
  '\'': '&#39;',
  '<': '&lt;',
  '>': '&gt;'
};

var escapeRegex = /[&"'<>]/g;

var exports = module.exports = {};

function lookupEscape(ch) {
  return escapeMap[ch];
}

function prettifyError(path, withInternals, err) {
  if (!err.Update) {
    // not one of ours, cast it
    err = new exports.TemplateError(err);
  }
  err.Update(path);

  // Unless they marked the dev flag, show them a trace from here
  if (!withInternals) {
    const old = err;
    err = new Error(old.message);
    err.name = old.name;
  }

  return err;
}

exports.prettifyError = prettifyError;

function TemplateError(message, lineno, colno) {
  var err;
  var cause;

  if (message instanceof Error) {
    cause = message;
    message = `${cause.name}: ${cause.message}`;
  }

  if (Object.setPrototypeOf) {
    err = new Error(message);
    Object.setPrototypeOf(err, TemplateError.prototype);
  } else {
    err = this;
    Object.defineProperty(err, 'message', {
      enumerable: false,
      writable: true,
      value: message,
    });
  }

  Object.defineProperty(err, 'name', {
    value: 'Template render error',
  });

  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, this.constructor);
  }

  let getStack;

  if (cause) {
    const stackDescriptor = Object.getOwnPropertyDescriptor(cause, 'stack');
    getStack = stackDescriptor && (stackDescriptor.get || (() => stackDescriptor.value));
    if (!getStack) {
      getStack = () => cause.stack;
    }
  } else {
    const stack = (new Error(message)).stack;
    getStack = (() => stack);
  }

  Object.defineProperty(err, 'stack', {
    get: () => getStack.call(this),
  });

  Object.defineProperty(err, 'cause', {
    value: cause
  });

  err.lineno = lineno;
  err.colno = colno;
  err.firstUpdate = true;

  err.Update = (path) => {
    let msg = '(' + (path || 'unknown path') + ')';

    // only show lineno + colno next to path of template
    // where error occurred
    if (this.firstUpdate) {
      if (this.lineno && this.colno) {
        msg += ` [Line ${this.lineno}, Column ${this.colno}]`;
      } else if (this.lineno) {
        msg += ` [Line ${this.lineno}]`;
      }
    }

    msg += '\n ';
    if (this.firstUpdate) {
      msg += ' ';
    }

    this.message = msg + (this.message || '');
    this.firstUpdate = false;
    return this;
  };

  return err;
}


if (Object.setPrototypeOf) {
  Object.setPrototypeOf(TemplateError.prototype, Error.prototype);
} else {
  TemplateError.prototype = Object.create(Error.prototype, {
    constructor: {
      value: TemplateError,
    },
  });
}

exports.TemplateError = TemplateError;

function escape(val) {
  return val.replace(escapeRegex, lookupEscape);
}

exports.escape = escape;

function isFunction(obj) {
  return ObjProto.toString.call(obj) === '[object Function]';
}

exports.isFunction = isFunction;

exports.isArray = Array.isArray || function isArray(obj) {
  return ObjProto.toString.call(obj) === '[object Array]';
};

function isString(obj) {
  return ObjProto.toString.call(obj) === '[object String]';
}

exports.isString = isString;

function isObject(obj) {
  return ObjProto.toString.call(obj) === '[object Object]';
}

exports.isObject = isObject;

function groupBy(obj, val) {
  const result = {};
  const iterator = isFunction(val) ? val : (o) => o[val];
  for (let i = 0; i < obj.length; i++) {
    const value = obj[i];
    const key = iterator(value, i);
    (result[key] || (result[key] = [])).push(value);
  }
  return result;
}

exports.groupBy = groupBy;

function toArray(obj) {
  return Array.prototype.slice.call(obj);
}

exports.toArray = toArray;

function without(array) {
  const result = [];
  if (!array) {
    return result;
  }
  const length = array.length;
  const contains = toArray(arguments).slice(1);
  let index = -1;

  while (++index < length) {
    if (indexOf(contains, array[index]) === -1) {
      result.push(array[index]);
    }
  }
  return result;
}

exports.without = without;

exports.extend = Object.assign;

function repeat(char_, n) {
  var str = '';
  for (let i = 0; i < n; i++) {
    str += char_;
  }
  return str;
}

exports.repeat = repeat;

function each(obj, func, context) {
  if (obj == null) {
    return;
  }

  if (ArrayProto.forEach && obj.forEach === ArrayProto.forEach) {
    obj.forEach(func, context);
  } else if (obj.length === +obj.length) {
    for (let i = 0, l = obj.length; i < l; i++) {
      func.call(context, obj[i], i, obj);
    }
  }
}

exports.each = each;

function map(obj, func) {
  var results = [];
  if (obj == null) {
    return results;
  }

  if (ArrayProto.map && obj.map === ArrayProto.map) {
    return obj.map(func);
  }

  for (let i = 0; i < obj.length; i++) {
    results[results.length] = func(obj[i], i);
  }

  if (obj.length === +obj.length) {
    results.length = obj.length;
  }

  return results;
}

exports.map = map;

function asyncIter(arr, iter, cb) {
  let i = -1;

  function next() {
    i++;

    if (i < arr.length) {
      iter(arr[i], i, next, cb);
    } else {
      cb();
    }
  }

  next();
}

exports.asyncIter = asyncIter;

function asyncFor(obj, iter, cb) {
  const keys = Object.keys(obj || {});
  const len = keys.length;
  let i = -1;

  function next() {
    i++;
    const k = keys[i];

    if (i < len) {
      iter(k, obj[k], i, len, next);
    } else {
      cb();
    }
  }

  next();
}

exports.asyncFor = asyncFor;

function indexOf(arr, searchElement, fromIndex) {
  return Array.prototype.indexOf.call(arr, searchElement, fromIndex);
}

exports.indexOf = indexOf;

exports.keys = Object.keys;

function inOperator(key, val) {
  if (exports.isArray(val)) {
    return exports.indexOf(val, key) !== -1;
  } else if (exports.isObject(val)) {
    return key in val;
  } else if (exports.isString(val)) {
    return val.indexOf(key) !== -1;
  }
  throw new Error('Cannot use "in" operator to search for "'
    + key + '" in unexpected types.');
}

exports.inOperator = inOperator;
