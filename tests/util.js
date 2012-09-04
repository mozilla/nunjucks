
var env = require('../src/environment');
var loaders = require('../src/node-loaders');

function render(str, ctx) {
    var e = new env.Environment(new loaders.FileSystemLoader('tests'));
    ctx = ctx || {};
    var t = new env.Template(str, e);
    return t.render(ctx);
}

module.exports = {
    render: render
};