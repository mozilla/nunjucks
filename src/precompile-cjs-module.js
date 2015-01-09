function precompileCjsModule(name, template, opts) {
    opts = opts || {};

    name = JSON.stringify(name);

    var out = 'module.exports[' + name + '] = ' +
        '(function() {\n' + template + '\n})();\n';

    return out;
}

module.exports = precompileCjsModule;
