function precompileCJS(name, body, opts) {
    var eol = opts.eol || '\n';

    var out = 'module.exports = {' + eol;
    out += '  name: ' + JSON.stringify(name) + ',' + eol;
    out += '  template: (function() {' + eol;
    out += body + eol;
    out += '  })()' + eol;
    out += '};';

    return out;
}

module.exports = precompileCJS;