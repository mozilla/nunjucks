'use strict';

var fs   = require('fs');
var path = require('path');

function configure(app, env) {
    app.set('view', NunjucksView.bind(null, env));
}

function NunjucksView(env, name, opts) {
    this.env           = env;
    this.name          = name;
    this.defaultEngine = opts.defaultEngine;
    this.ext           = path.extname(name);
    if (!this.ext && !this.defaultEngine) throw new Error('No default engine was specified and no extension was provided.');
    if (!this.ext) this.name += (this.ext = ('.' !== this.defaultEngine[0] ? '.' : '') + this.defaultEngine);
    this.path = this.lookupPath();
}

NunjucksView.prototype.lookupPath = function() {
    var fpath = this.name;
    this.env.loaders.forEach(function(loader) {
        loader.searchPaths.forEach(function(searchPath) {
            var index     = path.join(path.basename(this.name, this.ext), 'index' + this.ext);
            var indexpath = path.join(searchPath, index);
            if (fs.existsSync(indexpath)) fpath = index;
        }, this);
    }, this);
    return fpath;
};

NunjucksView.prototype.render = function(opts, cb) {
    this.env.render(this.path, opts, cb);
};

module.exports = {
    configure    : configure,
    NunjucksView : NunjucksView
};
