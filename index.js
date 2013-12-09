
var lib = require('./src/lib');
var env = require('./src/environment');
var compiler = require('./src/compiler');
var parser = require('./src/parser');
var lexer = require('./src/lexer');
var runtime = require('./src/runtime');
var Loader = require('./src/loader');
var loaders = require('./src/loaders');
var precompile = require('./src/precompile');

module.exports = {};
module.exports.Environment = env.Environment;
module.exports.Template = env.Template;

module.exports.Loader = Loader;
module.exports.FileSystemLoader = loaders.FileSystemLoader;
module.exports.WebLoader = loaders.WebLoader;

module.exports.compiler = compiler;
module.exports.parser = parser;
module.exports.lexer = lexer;
module.exports.runtime = runtime;

// A single instance of an environment, since this is so commonly used

var e;
module.exports.configure = function(templatesPath, opts) {
    opts = opts || {};
    if(lib.isObject(templatesPath)) {
        opts = templatesPath;
        templatesPath = null;
    }

    var noWatch = 'watch' in opts ? !opts.watch : false;
    var loader = loaders.FileSystemLoader || loaders.WebLoader;
    e = new env.Environment(new loader(templatesPath, noWatch), opts);

    if(opts && opts.express) {
        e.express(opts.express);
    }

    return e;
};

module.exports.compile = function(src, env, path, eagerCompile) {
    if(!e) {
        module.exports.configure();
    }
    return new module.exports.Template(src, env, path, eagerCompile);
};

module.exports.render = function(name, ctx, cb) {
    if(!e) {
        module.exports.configure();
    }

    return e.render(name, ctx, cb);
};

module.exports.renderString = function(src, ctx, cb) {
    if(!e) {
        module.exports.configure();
    }

    return e.renderString(src, ctx, cb);
};

if(precompile) {
    module.exports.precompile = precompile.precompile;
    module.exports.precompileString = precompile.precompileString;
}
