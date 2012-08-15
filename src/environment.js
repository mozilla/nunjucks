
var fs = require('fs');
var _ = require('underscore');
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
    init: function(ctx, blocks) {
        this.ctx = ctx;
        this.blocks = {};

        _.each(blocks, function(block, name) {
            this.addBlock(name, block);
        }, this);
    },

    lookup: function(name) {
        if(!(name in this.ctx)) {
            throw new Error("'" + name + "' is undefined");
        }
        return this.ctx[name];
    },

    addBlock: function(name, block) {
        this.blocks[name] = this.blocks[name] || [];
        this.blocks[name].push(block);
    },

    getBlock: function(name) {
        if(!this.blocks[name]) {
            throw new Error('unknown block "' + name + '"');
        }

        return this.blocks[name][0];
    }
});

var Template = Object.extend({
    init: function (str, env) {
        this.env = env || new Environment();
        this.tmplObj = null;

        var src = compiler.compile(str, this.env);
        var props = eval(src);
        
        this.blocks = this._getBlocks(props);
        this.rootRenderFunc = props.root;
    },

    render: function(ctx) {
        var context = new Context(ctx, this.blocks);
        return this.rootRenderFunc(this.env, context);
    },

    _getBlocks: function(props) {
        var blocks = {};

        for(var k in props) {
            if(k.slice(0, 2) == 'b_') {
                blocks[k.slice(2)] = props[k];
            }
        }

        return blocks;
    }
});

var env = new Environment();
var tmpl = env.get_template('test.html');
console.log(compiler.compile(fs.readFileSync('test.html', 'utf-8')));
console.log("OUTPUT ---");
console.log(tmpl.render({ username: "James" }));

module.exports = {
    Environment: Environment,
    Template: Template
};