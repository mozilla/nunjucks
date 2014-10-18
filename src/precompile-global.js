function precompileGlobal(name, body, opts) {
    var eol = opts.eol || '\n';

    var out = '(function() {' +
        '(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})' +
        '["' + name + '"] = (function() {' + body + '})();' + eol;

    if(opts && opts.asFunction) {
        out += 'return function(ctx, cb) { return nunjucks.render("' + name + '", ctx, cb); }';
    }

    out += '})();' + eol;
    return out;
}

module.exports = precompileGlobal;