'use strict';

function cycler(items) {
  var index = -1;

  return {
    current: null,
    reset() {
      index = -1;
      this.current = null;
    },

    next() {
      index++;
      if (index >= items.length) {
        index = 0;
      }

      this.current = items[index];
      return this.current;
    },
  };
}

function joiner(sep) {
  sep = sep || ',';
  let first = true;

  return () => {
    const val = first ? '' : sep;
    first = false;
    return val;
  };
}

// Making this a function instead so it returns a new object
// each time it's called. That way, if something like an environment
// uses it, they will each have their own copy.
function globals() {
  return {
    range(start, stop, step) {
      if (typeof stop === 'undefined') {
        stop = start;
        start = 0;
        step = 1;
      } else if (!step) {
        step = 1;
      }

      const arr = [];
      if (step > 0) {
        for (let i = start; i < stop; i += step) {
          arr.push(i);
        }
      } else {
        for (let i = start; i > stop; i += step) { // eslint-disable-line for-direction
          arr.push(i);
        }
      }
      return arr;
    },

    cycler() {
      return cycler(Array.prototype.slice.call(arguments));
    },

    joiner(sep) {
      return joiner(sep);
    }
  };
}

module.exports = globals;
