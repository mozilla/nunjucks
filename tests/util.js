
var env = require('../src/environment');
var loaders = require('../src/node-loaders');

function render(str, ctx, cb) {
    var e = new env.Environment(new loaders.FileSystemLoader('tests/templates'), null, true);
    ctx = ctx || {};
    var t = new env.Template(str, e);
    t.render(ctx, cb);
}

module.exports = {
    render: render
};
