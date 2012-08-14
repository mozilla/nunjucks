
var env = require('../src/environment');

function render(str, ctx) {
    ctx = ctx || {};
    var t = new env.Template(str);
    return t.render(ctx);
}

module.exports = {
    render: render
};