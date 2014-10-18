function precompileESModule(name, body, opts) {
    var eol = opts.eol || '\n';

    var out = 'var template = {' + eol;
    out += '  name: ' + JSON.stringify(name) + ',' + eol;
    out += '  template: (function() {' + eol;
    out += body + eol;
    out += '  })()' + eol;
    out += '};' + eol + eol;
    out += 'export default template;' + eol;

    return out;
}

module.exports = precompileESModule;