function precompileGlobal(name, template, opts) {
    opts = opts || {};

    name = JSON.stringify(name);

    var out = '(function() {' +
        '(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})' +
        '[' + name + '] = (function() {\n' + template + '\n})();\n';

    if(opts.asFunction) {
        out += 'return function(ctx, cb) { return nunjucks.render(' + name + ', ctx, cb); }\n';
    }

    out += '})();\n';
    return out;
}

module.exports = precompileGlobal;