var fs = require('fs');
var path = require('path');
var lib = require('./lib');
var compiler = require('./compiler');
var Environment = require('./environment').Environment;

function precompile(inputPath, env, force) {
    // Generate the JavaScript for a template or a directory of
    // templates. `env` is optional, and if passed the installed
    // filters and extensions will be used. `force` is optional, and
    // will make the compiler continue on error.

    env = env || new Environment([]);
    var asyncFilters = env.asyncFilters;
    var extensions = env.extensionsList;

    var pathStats = fs.statSync(inputPath);
    var output = '';

    if(pathStats.isFile()) {
        return precompileString(fs.readFileSync(inputPath, 'utf-8'),
                                inputPath,
                                env);
    }
    else {
        if(!pathStats.isDirectory()) {
            throw new Error(inputPath + ' is not a file or directory');
        }

        var templates = [];

        function addTemplates(dir) {
            var files = fs.readdirSync(dir);

            for(var i=0; i<files.length; i++) {
                var filepath = path.join(dir, files[i]);
                var stat = fs.statSync(filepath);

                if(stat && stat.isDirectory()) {
                    addTemplates(filepath);
                }
                else if(path.extname(filepath) == '.html') {
                    templates.push(filepath);
                }
            }
        }

        addTemplates(inputPath);

        output += '(function() {';
        output += 'window.nunjucksPrecompiled = window.nunjucksPrecompiled || {};';

        for(var i=0; i<templates.length; i++) {
            var doCompile = function() {
                var src = lib.withPrettyErrors(
                    templates[i],
                    false,
                    function() {
                        return compiler.compile(fs.readFileSync(templates[i], 'utf-8'),
                                                asyncFilters,
                                                extensions,
                                                templates[i]);
                    }
                );
                
                var name = templates[i].replace(path.join(inputPath, '/'), '');

                output += 'window.nunjucksPrecompiled["' + name + '"] = (function() {';
                output += src;
                output += '})();';
            };

            // Don't stop generating the output if we're forcing compilation.
            if(force) {
                try {
                    doCompile();
                } catch(e) {
                    console.error(e);
                }
            }
            else {
                doCompile();
            }
        }

        output += '})();';
        return output;
    }
}

function precompileString(str, filepath, env) {
    env = env || new Environment([]);

    if(!filepath) {
        throw new Error("precompileString: filepath is required");
    }

    var asyncFilters = env.asyncFilters;
    var extensions = env.extensionsList;

    var out = '(window.nunjucksPrecompiled = window.nunjucksPrecompiled || {})\n' +
        '.addPrecompiled("' + filepath + '", (function() {';
    out += lib.withPrettyErrors(
        filepath,
        false,
        function() {
            return compiler.compile(str, 
                                    asyncFilters,
                                    extensions,
                                    filepath);
        }
    );
    out += '})());';
    return out;
}

module.exports = precompile;

console.log(precompileString('foo'));
