
var fs = require('fs');
var _ = require('underscore');
var Object = require('./object');
var compiler = require('./compiler');
var builtin_filters = require('./filters');
var builtin_loaders = require('./loaders');

var Environment = Object.extend({
    init: function(loaders) {
        if(!loaders) {
            this.loaders = [new builtin_loaders.FileSystemLoader()];
        }
        else {
            this.loaders = _.isArray(loaders) ? loaders : [loaders];
        }

        this.filters = builtin_filters;
    },

    addFilter: function(name, func) {
        this.filters[name] = func;
    },

    getFilter: function(name) {
        return this.filters[name];
    },

    getTemplate: function(name) {
        var src = null;

        for(var i=0; i<this.loaders.length; i++) {
            if((src = this.loaders[i].getSource(name))) {
                break;
            }
        }

        if(!src) {
            throw new Error('template not found: ' + name);
        }

        return new Template(src, this);
    },

    express: function(app) {
        var env = this;

        app.render = function(name, ctx, k) {
            var context = {};

            if(_.isFunction(ctx)) {
                k = ctx;
                ctx = {};
            }

            context = _.extend(context, app.locals);

            if(ctx._locals) {
                context = _.extend(context, ctx._locals);
            }

            context = _.extend(context, ctx);

            var res = env.getTemplate(name).render(ctx);
            k(null, res);            
        };
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
    },

    getSuper: function(env, name, block) {
        var idx = _.indexOf(this.blocks[name] || [], block);
        var blk = this.blocks[name][idx + 1];
        var context = this;

        return function() {
            if(idx == -1 || !blk) {
                throw new Error('no super block available for "' + name + '"');
            }

            return blk(env, context);
        };
    }
});

var Template = Object.extend({
    init: function (str, env) {
        this.env = env || new Environment();
        this.tmplSrc = str;
        this.compiled = false;
    },

    render: function(ctx) {
        if(!this.compiled) {
            this._compile();
        }

        var context = new Context(ctx, this.blocks);
        return this.rootRenderFunc(this.env, context);
    },

    _compile: function() {
        var func = new Function(compiler.compile(this.tmplSrc, this.env));
        var props = func();
        
        this.blocks = this._getBlocks(props);
        this.rootRenderFunc = props.root;
        this.compiled = true;
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

// var env = new Environment();
// console.log(compiler.compile(fs.readFileSync('test.html', 'utf-8')));

// var tmpl = env.getTemplate('test.html');
// console.log("OUTPUT ---");
// console.log(tmpl.render({ username: "James" }));

module.exports = {
    Environment: Environment,
    Template: Template
};