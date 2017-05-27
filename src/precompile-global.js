'use strict';

function precompileGlobal(templates, opts) {
    var out = '', name, template;
    opts = opts || {};

    out += '// nunjucks precompiled templates\n';
    out += '(function (root, factory) {\n' +
        '\tif (typeof define === \'function\' && define.amd) {\n' +
            '\t\t// AMD. Register as a named module.\n' +
            '\t\tdefine(\'nunjucksPrecompiled\', [], function () {\n' +
                '\t\t\treturn (root.nunjucksPrecompiled = factory());\n' +
            '\t\t});\n' +
        '\t} else if (typeof module === \'object\' && module.exports) {\n' +
            '\t\t// Node. Does not work with strict CommonJS,\n' +
            '\t\t// but only CommonJS-like environments that support module.exports, like Node.\n' +
            '\t\tGLOBAL.nunjucksPrecompiled = factory();\n' +
        '\t} else {\n' +
            '\t\t// Browser globals\n' +
            '\t\troot.nunjucksPrecompiled = factory();\n' +
        '\t}\n' +
    '}(this, function () {\n' +
            '\treturn {\n';
            for ( var i = 0; i < templates.length; i++ ) {
                name = JSON.stringify(templates[i].name);
                template = templates[i].template;

                out += '\n\t\t// Begin template ' + name + '\n';
                out += '\t\t' + name + ': (function() {\n' + template + '\n})()';
                if (i < templates.length - 1) {
                    out += ',';
                }
                out += '\n\t\t// End of template ' + name + '\n';
            }
            out += '\n\t};\n' +
    '}));';

    // TODO: Reinstate the opt.asFunction logic
    // TODO: Remove the commented out original code below when opts.asFunction is complete
    //for ( var i = 0; i < templates.length; i++ ) {
    //    name = JSON.stringify(templates[i].name);
    //
    //    out += '(function() {' +
    //        '(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})' +
    //        '[' + name + '] = (function() {\n' + template + '\n})();\n';
    //
    //    if(opts.asFunction) {
    //        out += 'return function(ctx, cb) { return nunjucks.render(' + name + ', ctx, cb); }\n';
    //    }
    //
    //    out += '})();\n';
    //}
    return out;
}

module.exports = precompileGlobal;
