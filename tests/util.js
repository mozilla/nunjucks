
var env = require('../src/environment');
var loaders = require('../src/loaders');

function render(str, ctx) {
    var e = new env.Environment(new loaders.FileSystemLoader('tests'));
    ctx = ctx || {};
    var t = new env.Template(e, str);
    return t.render(ctx);
}

module.exports = {
    render: render
};