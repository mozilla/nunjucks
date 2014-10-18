function precompileAMD(name, body, opts) {
    var eol = opts.eol || '\n';

    var out = 'define(' + JSON.stringify(name) + ', function() {' + eol +
        body + eol + '});' + eol;
    return out;
}

module.exports = precompileAMD;