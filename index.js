
var env = require('./src/environment');
var compiler = require('./src/compiler');
var parser = require('./src/parser');
var lexer = require('./src/lexer');
var runtime = require('./src/runtime');
var Loader = require('./src/loader');
var loaders = require('./src/loaders');

module.exports = {};
module.exports.Environment = env.Environment;
module.exports.Template = env.Template;
module.exports.Loader = env.Loader;

// loaders is not available when using precompiled templates
if(loaders) {
    if(loaders.FileSystemLoader) {
        module.exports.FileSystemLoader = loaders.FileSystemLoader;
    }
    else {
        module.exports.HttpLoader = loaders.HttpLoader;
    }
}

module.exports.compiler = compiler;
module.exports.parser = parser;
module.exports.lexer = lexer;
module.exports.runtime = runtime;
