
var env = require('../src/environment');
var loaders = require('../src/node-loaders');

function render(str, ctx, extensions) {
    var e = new env.Environment(new loaders.FileSystemLoader('tests/templates'));

    for(var name in extensions) {
        e.addExtension(name, extensions[name]);
    }

    ctx = ctx || {};
    var t = new env.Template(str, e);
    return t.render(ctx);
}

module.exports = {
    render: render
};
