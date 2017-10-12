'use strict';

var SafeString = require('./runtime').SafeString;

/**
 * Returns `true` if the object is a function, otherwise `false`.
 * @param { any } value
 * @returns { boolean }
 */
exports.callable = function(value) {
  return typeof value === 'function';
};

/**
 * Returns `true` if the object is strictly not `undefined`.
 * @param { any } value
 * @returns { boolean }
 */
exports.defined = function(value) {
  return value !== undefined;
};

/**
 * Returns `true` if the operand (one) is divisble by the test's argument
 * (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */
exports.divisibleby = function(one, two) {
  return (one % two) === 0;
};

/**
 * Returns true if the string has been escaped (i.e., is a SafeString).
 * @param { any } value
 * @returns { boolean }
 */
exports.escaped = function(value) {
  return value instanceof SafeString;
};

/**
 * Returns `true` if the arguments are strictly equal.
 * @param { any } one
 * @param { any } two
 */
exports.equalto = function(one, two) {
  return one === two;
};

// Aliases
exports.eq = exports.equalto;
exports.sameas = exports.equalto;

/**
 * Returns `true` if the value is evenly divisible by 2.
 * @param { number } value
 * @returns { boolean }
 */
exports.even = function(value) {
  return value % 2 === 0;
};

/**
 * Returns `true` if the value is falsy - if I recall correctly, '', 0, false,
 * undefined, NaN or null. I don't know if we should stick to the default JS
 * behavior or attempt to replicate what Python believes should be falsy (i.e.,
 * empty arrays, empty dicts, not 0...).
 * @param { any } value
 * @returns { boolean }
 */
exports.falsy = function(value) {
  return !value;
};

/**
 * Returns `true` if the operand (one) is greater or equal to the test's
 * argument (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */
exports.ge = function(one, two) {
  return one >= two;
};

/**
 * Returns `true` if the operand (one) is greater than the test's argument
 * (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */
exports.greaterthan = function(one, two) {
  return one > two;
};

// alias
exports.gt = exports.greaterthan;

/**
 * Returns `true` if the operand (one) is less than or equal to the test's
 * argument (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */
exports.le = function(one, two) {
  return one <= two;
};

/**
 * Returns `true` if the operand (one) is less than the test's passed argument
 * (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */
exports.lessthan = function(one, two) {
  return one < two;
};

// alias
exports.lt = exports.lessthan;

/**
 * Returns `true` if the string is lowercased.
 * @param { string } value
 * @returns { boolean }
 */
exports.lower = function(value) {
  return value.toLowerCase() === value;
};

/**
 * Returns `true` if the operand (one) is less than or equal to the test's
 * argument (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */
exports.ne = function(one, two) {
  return one !== two;
};

/**
 * Returns true if the value is strictly equal to `null`.
 * @param { any }
 * @returns { boolean }
 */
exports.null = function(value) {
  return value === null;
};

/**
 * Returns true if value is a number.
 * @param { any }
 * @returns { boolean }
 */
exports.number = function(value) {
  return typeof value === 'number';
};

/**
 * Returns `true` if the value is *not* evenly divisible by 2.
 * @param { number } value
 * @returns { boolean }
 */
exports.odd = function(value) {
  return value % 2 === 1;
};

/**
 * Returns `true` if the value is a string, `false` if not.
 * @param { any } value
 * @returns { boolean }
 */
exports.string = function(value) {
  return typeof value === 'string';
};

/**
 * Returns `true` if the value is not in the list of things considered falsy:
 * '', null, undefined, 0, NaN and false.
 * @param { any } value
 * @returns { boolean }
 */
exports.truthy = function(value) {
  return !!value;
};

/**
 * Returns `true` if the value is undefined.
 * @param { any } value
 * @returns { boolean }
 */
exports.undefined = function(value) {
  return value === undefined;
};

/**
 * Returns `true` if the string is uppercased.
 * @param { string } value
 * @returns { boolean }
 */
exports.upper = function(value) {
  return value.toUpperCase() === value;
};

/**
 * If ES6 features are available, returns `true` if the value implements the
 * `Symbol.iterator` method. If not, it's a string or Array.
 * @param { any } value
 * @returns { boolean }
 */
exports.iterable = function(value) {
  if (Symbol) {
    return !!value[Symbol.iterator];
  } else {
    return Array.isArray(value) || typeof value === 'string';
  }
};

/**
 * If ES6 features are available, returns `true` if the value is an object hash
 * or an ES6 Map. Otherwise just return if it's an object hash.
 * @param { any } value
 * @returns { boolean }
 */
exports.mapping = function(value) {
  // only maps and object hashes
  var bool = value !== null
      && value !== undefined
      && typeof value === 'object'
      && !Array.isArray(value);
  if (Set) {
    return bool && !(value instanceof Set);
  } else {
    return bool;
  }
};