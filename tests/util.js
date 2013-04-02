
var env = require('../src/environment');
var loaders = require('../src/node-loaders');

function render(str, ctx, opts) {
    opts = opts || {};
    var e = new env.Environment(new loaders.FileSystemLoader('tests/templates'), opts);

    if(opts.filters) {
        for(var name in opts.filters) {
            e.addFilter(name, opts.filters[name]);
        }        
    }

    if(opts.extensions) {
        for(var name in opts.extensions) {
            e.addExtension(name, opts.extensions[name]);
        }
    }

    ctx = ctx || {};
    var t = new env.Template(str, e);
    return t.render(ctx);
}

module.exports = {
    render: render
};
