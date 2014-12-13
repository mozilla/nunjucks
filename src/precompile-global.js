function precompileGlobal(name, template, opts) {
    opts = opts || {};

    name = JSON.stringify(name);

    var out = '(function() {' +
        'var env = null; try { if (window) env = window; } catch(e) {}; if (!env) env = module.exports = module.exports || {};' +
        '(env.nunjucksPrecompiled = env.nunjucksPrecompiled || {})' +
        '[' + name + '] = (function() {\n' + template + '\n})();\n';

    if(opts.asFunction) {
        out += 'return function(ctx, cb) { return nunjucks.render(' + name + ', ctx, cb); }\n';
    }

    out += '})();\n';
    return out;
}

module.exports = precompileGlobal;