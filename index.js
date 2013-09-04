
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

module.exports.Loader = env.Loader;
module.exports.FileSystemLoader = loaders.FileSystemLoader;
module.exports.WebLoader = loaders.WebLoader;

module.exports.compiler = compiler;
module.exports.parser = parser;
module.exports.lexer = lexer;
module.exports.runtime = runtime;

// A single instance of an environment, since this is so commonly used

var e;
module.exports.configure = function(dirOrURL, opts) {
    if(typeof dirOrURL != 'string') {
        throw new Error('must pass templates path or URL to `configure` ' +
                        'as first argument');
    }

    e = new env.Environment(new (loaders.FileSystemLoader || loaders.WebLoader)(dirOrURL, opts.watch),
                            opts);

    if(opts && opts.express) {
        e.express(opts.express);
    }
    return e;
};

module.exports.render = function(name, ctx, cb) {
    return e.render(name, ctx, cb);
};

module.exports.getLoader = function() {
    return e.getPrimaryLoader();
}

module.exports.precompile = precompile;
