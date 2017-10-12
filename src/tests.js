'use strict';

var SafeString = require('./runtime').SafeString;

exports.callable = function(value) {
  return typeof value === 'function';
};

exports.defined = function(value) {
  return value !== undefined;
};

exports.divisibleby = function(one, two) {
  return (one % two) === 0;
};

exports.escaped = function(value) {
  return value instanceof SafeString;
};

exports.equalto = function(one, two) {
  return one === two;
};

exports.even = function(value) {
  return value % 2 === 0;
};

exports.falsy = function(value) {
  return !value;
};

exports.greaterthan = function(one, two) {
  return one > two;
};

exports.lessthan = function(one, two) {
  return one < two;
};

exports.lower = function(value) {
  return value.toLowerCase() === value;
};

exports.number = function(value) {
  return typeof value === 'number';
};

exports.none = function(value) {
  return value === null;
};

exports.null = function(value) {
  return value === null;
};

exports.odd = function(value) {
  return value % 2 === 1;
};

exports.sameas = function(one, two) {
  return Object.is(one, two);
};

exports.string = function(value) {
  return typeof value === 'string';
};

exports.truthy = function(value) {
  return !!value;
};

exports.undefined = function(value) {
  return value === undefined;
};

exports.upper = function(value) {
  return value.toUpperCase() === value;
};

/**
 * ES6 features required. Unless we're okay with nuking IE support, these may
 * need to be removed.
 */

exports.iterable = function(value) {
  if (Symbol) {
    return !!value[Symbol.iterator];
  } else {
    throw new Error('ES6 Symbols are unavailable in your browser or runtime environment');
  }
};

exports.mapping = function(value) {
  // only maps and object hashes
  if (Set) {
    return value !== null
      && value !== undefined
      && typeof value === 'object'
      && !Array.isArray(value)
      && !(value instanceof Set);
  } else {
    throw new Error('ES6 Sets are unavailable in your browser or runtime environment.');
  }
};