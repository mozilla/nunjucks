
var lib = require('./lib');
var Object = require('./object');
var lexer = require('./lexer');
var compiler = require('./compiler');
var builtin_filters = require('./filters');
var builtin_loaders = require('./loaders');
var Frame = require('./runtime').Frame;

var Environment = Object.extend({
    init: function(loaders, tags) {
        if(!loaders) {
            // The filesystem loader is only available client-side
            if(builtin_loaders.FileSystemLoader) {
                this.loaders = [new builtin_loaders.FileSystemLoader()];
            }
            else {
                this.loaders = [new builtin_loaders.HttpLoader('/views')];
            }
        }
        else {
            this.loaders = lib.isArray(loaders) ? loaders : [loaders];
        }

        if(tags) {
            lexer.setTags(tags);
        }

        this.filters = builtin_filters;
        this.cache = {};
    },

    addFilter: function(name, func) {
        this.filters[name] = func;
    },

    getFilter: function(name) {
        return this.filters[name];
    },

    getTemplate: function(name, eagerCompile) {
        var info = null;
        var tmpl = this.cache[name];
        var upToDate;

        if(!tmpl || !tmpl.isUpToDate()) {
            for(var i=0; i<this.loaders.length; i++) {
                if((info = this.loaders[i].getSource(name))) {
                    break;
                }
            }

            if(!info) {
                throw new Error('template not found: ' + name);
            }

            this.cache[name] = new Template(info.src,
                                            this,
                                            info.path,
                                            info.upToDate,
                                            eagerCompile);
        }

        return this.cache[name];
    },

    registerPrecompiled: function(templates) {
        for(var name in templates) {
            this.cache[name] = new Template({ type: 'code',
                                              obj: templates[name] },
                                            this,
                                            name,
                                            function() { return true; },
                                            true);
        }
    },

    express: function(app) {
        var env = this;

        app.render = function(name, ctx, k) {
            var context = {};

            if(lib.isFunction(ctx)) {
                k = ctx;
                ctx = {};
            }

            context = lib.extend(context, app.locals);

            if(ctx._locals) {
                context = lib.extend(context, ctx._locals);
            }

            context = lib.extend(context, ctx);

            var res = env.render(name, ctx);
            k(null, res);            
        };
    },

    render: function(name, ctx) {
        return this.getTemplate(name).render(ctx);
    }
});

var Context = Object.extend({
    init: function(ctx, blocks) {
        this.ctx = ctx;
        this.blocks = {};

        for(var name in blocks) {
            this.addBlock(name, blocks[name]);
        }
    },

    lookup: function(name) {
        return this.ctx[name];
    },

    setVariable: function(name, val) {
        this.ctx[name] = val;
    },
    
    getVariables: function() {
        return this.ctx;
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
        var idx = (this.blocks[name] || []).indexOf(block);
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
    init: function (src, env, path, upToDate, eagerCompile) {
        this.env = env || new Environment();

        if(lib.isObject(src)) {
            switch(src.type) {
            case 'code': this.tmplProps = src.obj; break;
            case 'string': this.tmplStr = src.obj; break;
            }
        }
        else if(lib.isString(src)) {
            this.tmplStr = src;
        }
        else {
            throw new Error("src must be a string or an object describing " +
                            "the source");
        }

        this.path = path;
        this.upToDate = upToDate || function() { return false; };

        if(eagerCompile) {
            this._compile();
        }
        else {
            this.compiled = false;
        }
    },

    render: function(ctx, frame) {
        if(!this.compiled) {
            this._compile();
        }

        var context = new Context(ctx || {}, this.blocks);
        return this.rootRenderFunc(this.env,
                                   context,
                                   frame || new Frame());
    },

    isUpToDate: function() {
        return this.upToDate();
    },

    _compile: function() {
        var props;

        if(this.tmplProps) {
            props = this.tmplProps;
        }
        else {
            var func = new Function(compiler.compile(this.tmplStr, this.env));
            props = func();
        }
        
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

// var fs = require('fs');
// //var src = fs.readFileSync('test.html', 'utf-8');
// var src = "{% for i in [1,2,3] %}{% include 'item.html' %}{% endfor %}";

// var env = new Environment();
// console.log(compiler.compile(src));

// var tmpl = new Template(src, env);
// console.log("OUTPUT ---");
// console.log(tmpl.render({ username: "James" }));

module.exports = {
    Environment: Environment,
    Template: Template
};