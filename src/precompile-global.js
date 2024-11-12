'use strict';

function precompileGlobal(templates, opts) {
  var out = '';
  opts = opts || {};

  for (let i = 0; i < templates.length; i++) {
    const name = JSON.stringify(templates[i].name);
    const template = templates[i].template;

    out += '(function() {' +
      '(window.govjucksPrecompiled = window.govjucksPrecompiled || {})' +
      '[' + name + '] = (function() {\n' + template + '\n})();\n';

    if (opts.asFunction) {
      out += 'return function(ctx, cb) { return govjucks.render(' + name + ', ctx, cb); }\n';
    }

    out += '})();\n';
  }
  return out;
}

module.exports = precompileGlobal;
