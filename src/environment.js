
var fs = require('fs');
var Object = require('./object');
var compiler = require('./compiler');
var builtin_filters = require('./filters');

var Environment = Object.extend({
    init: function() {
        this.filters = builtin_filters;
    },

    add_filter: function(name, func) {
        this.filters[name] = func;
    },

    get_filter: function(name) {
        return this.filters[name];
    },

    get_template: function(name) {
        return new Template(fs.readFileSync(name, 'utf-8'), this);
    }
});

var Context = Object.extend({
    init: function(ctx) {
        this.ctx = ctx;
    },

    lookup: function(name) {
        if(!(name in this.ctx)) {
            throw new Error("'" + name + "' is undefined");
        }
        return this.ctx[name];
    }
});

var Template = Object.extend({
    init: function (src, env) {
        this.src = src;
        this.env = env || new Environment();
        this.tmpl_cache = null;
    },

    render: function(ctx) {
        var tmpl;

        if(this.tmpl_cache) {
            tmpl = this.tmpl_cache;
        }
        else {
            tmpl = compiler.compile(this.src);
            this.tmpl_cache = tmpl;
        }

        var context = new Context(ctx);
        var f = eval(tmpl);
        return f(this.env, context);
    }
});

// var env = new Environment();
// var tmpl = env.get_template('test.html');
// console.log(compiler.compile(tmpl.src));
// console.log("OUTPUT ---");
// console.log(tmpl.render({ username: "James" }));

module.exports = {
    Environment: Environment,
    Template: Template
};