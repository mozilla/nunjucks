var fs = require('fs');
var path = require('path');
var lib = require('./lib');
var compiler = require('./compiler');
var Environment = require('./environment').Environment;
var precompilers = {
      global: require('./precompile-global'),
      amd: require('./precompile-amd'),
      cjs: require('./precompile-cjs'),
      esm: require('./precompile-esm')
    };

function match(filename, patterns) {
    if (!Array.isArray(patterns)) return false;
    return patterns.some(function (pattern) {
        return filename.match(pattern) !== null;
    });
}

function precompileString(str, opts) {
    opts = opts || {};
    opts.isString = true;
    return precompile(str, opts);
}

function precompile(input, opts) {
    // The following options are available:
    //
    // * name: name of the template (auto-generated when compiling a directory)
    // * isString: input is a string, not a file path
    // * asFunction: generate a callable function
    // * force: keep compiling on error
    // * env: the Environment to use (gets extensions and async filters from it)
    // * include: which file/folders to include (folders are auto-included, files are auto-excluded)
    // * exclude: which file/folders to exclude (folders are auto-included, files are auto-excluded)
    // * format: change the output format: one of "global" (default), "amd", "cjs" or "esm"

    opts = opts || {};
    var format = opts.format || 'global';
    var env = opts.env || new Environment([]);
    var asyncFilters = env.asyncFilters;
    var extensions = env.extensionsList;

    var pathStats = fs.existsSync(input) && fs.statSync(input);
    var output = '';

    if(!precompilers[format]) {
        throw new Error('Unknown format: "' + format + '"');
    }

    if(opts.isString) {
        if(!opts.name) {
            throw new Error('the "name" option is required when ' +
                            'compiling a string');
        }

        return _precompile(input,
                           opts.name,
                           env,
                           format,
                           opts);
    }
    else if(pathStats.isFile()) {
        return _precompile(fs.readFileSync(input, 'utf-8'),
                           opts.name || input,
                           env,
                           format,
                           opts);
    }
    else if(pathStats.isDirectory()) {
        var templates = [];

        function addTemplates(dir) {
            var files = fs.readdirSync(dir);

            for(var i=0; i<files.length; i++) {
                var filepath = path.join(dir, files[i]);
                var subpath = filepath.substr(path.join(input, '/').length);
                var stat = fs.statSync(filepath);

                if(stat && stat.isDirectory()) {
                    subpath += '/';
                    if (!match(subpath, opts.exclude)) {
                        addTemplates(filepath);
                    }
                }
                else if(match(subpath, opts.include)) {
                    templates.push(filepath);
                }
            }
        }

        addTemplates(input);

        for(var i=0; i<templates.length; i++) {
            var name = templates[i].replace(path.join(input, '/'), '');

            try {
                output += _precompile(fs.readFileSync(templates[i], 'utf-8'),
                                      name,
                                      env,
                                      format,
                                      opts);
            } catch(e) {
                if(opts.force) {
                    // Don't stop generating the output if we're
                    // forcing compilation.
                    console.error(e);
                }
                else {
                    throw e;
                }
            }
        }

        return output;
    }
}

function _precompile(str, name, env, format, opts) {
    env = env || new Environment([]);

    var asyncFilters = env.asyncFilters;
    var extensions = env.extensionsList;
    name = name.replace(/\\/g, '/');

    var body = lib.withPrettyErrors(
            name,
            false,
            function() {
                return compiler.compile(str,
                                        asyncFilters,
                                        extensions,
                                        name);
            }
        );

    return precompilers[format](name, body, opts);
}

module.exports = {
    precompile: precompile,
    precompileString: precompileString
}
