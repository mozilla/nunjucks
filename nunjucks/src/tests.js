'use strict';

import {SafeString} from './runtime';

/**
 * Returns `true` if the object is a function, otherwise `false`.
 * @param { any } value
 * @returns { boolean }
 */
export function callable(value) {
  return typeof value === 'function';
}

/**
 * Returns `true` if the object is strictly not `undefined`.
 * @param { any } value
 * @returns { boolean }
 */
export function defined(value) {
  return value !== undefined;
}

/**
 * Returns `true` if the operand (one) is divisble by the test's argument
 * (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */
export function divisibleby(one, two) {
  return (one % two) === 0;
}

/**
 * Returns true if the string has been escaped (i.e., is a SafeString).
 * @param { any } value
 * @returns { boolean }
 */
export function escaped(value) {
  return value instanceof SafeString;
}

/**
 * Returns `true` if the arguments are strictly equal.
 * @param { any } one
 * @param { any } two
 */
export function equalto(one, two) {
  return one === two;
}

// Aliases
export const eq = equalto;
export const sameas = equalto;

/**
 * Returns `true` if the value is evenly divisible by 2.
 * @param { number } value
 * @returns { boolean }
 */
export function even(value) {
  return value % 2 === 0;
}

/**
 * Returns `true` if the value is falsy - if I recall correctly, '', 0, false,
 * undefined, NaN or null. I don't know if we should stick to the default JS
 * behavior or attempt to replicate what Python believes should be falsy (i.e.,
 * empty arrays, empty dicts, not 0...).
 * @param { any } value
 * @returns { boolean }
 */
export function falsy(value) {
  return !value;
}

/**
 * Returns `true` if the operand (one) is greater or equal to the test's
 * argument (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */
export function ge(one, two) {
  return one >= two;
}

/**
 * Returns `true` if the operand (one) is greater than the test's argument
 * (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */
export function greaterthan(one, two) {
  return one > two;
}

// alias
export const gt = greaterthan;

/**
 * Returns `true` if the operand (one) is less than or equal to the test's
 * argument (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */
export function le(one, two) {
  return one <= two;
}

/**
 * Returns `true` if the operand (one) is less than the test's passed argument
 * (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */
export function lessthan(one, two) {
  return one < two;
}

// alias
export const lt = lessthan;

/**
 * Returns `true` if the string is lowercased.
 * @param { string } value
 * @returns { boolean }
 */
export function lower(value) {
  return value.toLowerCase() === value;
}

/**
 * Returns `true` if the operand (one) is less than or equal to the test's
 * argument (two).
 * @param { number } one
 * @param { number } two
 * @returns { boolean }
 */
export function ne(one, two) {
  return one !== two;
}

/**
 * Returns true if the value is strictly equal to `null`.
 * @param { any } value
 * @returns { boolean }
 */
function nullTest(value) {
  return value === null;
}

export {nullTest as null};

/**
 * Returns true if value is a number.
 * @param { any } value
 * @returns { boolean }
 */
export function number(value) {
  return typeof value === 'number';
}

/**
 * Returns `true` if the value is *not* evenly divisible by 2.
 * @param { number } value
 * @returns { boolean }
 */
export function odd(value) {
  return value % 2 === 1;
}

/**
 * Returns `true` if the value is a string, `false` if not.
 * @param { any } value
 * @returns { boolean }
 */
export function string(value) {
  return typeof value === 'string';
}

/**
 * Returns `true` if the value is not in the list of things considered falsy:
 * '', null, undefined, 0, NaN and false.
 * @param { any } value
 * @returns { boolean }
 */
export function truthy(value) {
  return !!value;
}

/**
 * Returns `true` if the value is undefined.
 * @param { any } value
 * @returns { boolean }
 */
function undefinedTest(value) {
  return value === undefined;
}

export {undefinedTest as undefined};

/**
 * Returns `true` if the string is uppercased.
 * @param { string } value
 * @returns { boolean }
 */
export function upper(value) {
  return value.toUpperCase() === value;
}

/**
 * If ES6 features are available, returns `true` if the value implements the
 * `Symbol.iterator` method. If not, it's a string or Array.
 *
 * Could potentially cause issues if a browser exists that has Set and Map but
 * not Symbol.
 *
 * @param { any } value
 * @returns { boolean }
 */
export function iterable(value) {
  if (typeof Symbol !== 'undefined') {
    return !!value[Symbol.iterator];
  } else {
    return Array.isArray(value) || typeof value === 'string';
  }
}

/**
 * If ES6 features are available, returns `true` if the value is an object hash
 * or an ES6 Map. Otherwise just return if it's an object hash.
 * @param { any } value
 * @returns { boolean }
 */
export function mapping(value) {
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
}
