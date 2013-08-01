var lib = require('./lib');
var Object = require('./object');
var lexer = require('./lexer');
var compiler = require('./compiler');
var builtin_filters = require('./filters');
var builtin_loaders = require('./loaders');
var runtime = require('./runtime');
var globals = require('./globals');
var Frame = runtime.Frame;

var Environment = Object.extend({
    init: function(loaders, opts) {
        // The dev flag determines the trace that'll be shown on errors.
        // If set to true, returns the full trace from the error point,
        // otherwise will return trace starting from Template.render
        // (the full trace from within nunjucks may confuse developers using
        //  the library)
        // defaults to false
        opts = opts || {};
        this.dev = !!opts.dev;

        // The autoescape flag sets global autoescaping. If true,
        // every string variable will be escaped by default.
        // If false, strings can be manually escaped using the `escape` filter.
        // defaults to false
        this.autoesc = !!opts.autoescape;

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

        if(opts.tags) {
            lexer.setTags(opts.tags);
        }

        this.filters = {};
        this.cache = {};
        this.extensions = {};
        this.extensionsList = [];

        for(var name in builtin_filters) {
            this.addFilter(name, builtin_filters[name]);
        }
    },

    addExtension: function(name, extension) {
        extension._name = name;
        this.extensions[name] = extension;
        this.extensionsList.push(extension);
    },

    getExtension: function(name) {
        return this.extensions[name];
    },

    addFilter: function(name, func, async) {
        var wrapped = func;

        if(!async) {
            wrapped = function() {
                var args = arguments;
                
                // The callback was passed as the last parameter,

                var arglen = args.length - 1;
                if(args.length - 1 < func.length) {
                    args = Array.prototype.slice.call(arguments, 0, arguments.length - 1);

                    while(args.length < func.length) {
                        args.push(undefined);
                    }
                }
                var cb = arguments[arguments.length - 1];

                try {
                    cb(null, func.apply(this, args));
                }
                catch(e) {
                    cb(e);
                }
            };
        }

        this.filters[name] = wrapped;
    },

    getFilter: function(name) {
        if(!this.filters[name]) {
            throw new Error('filter not found: ' + name);
        }
        return this.filters[name];
    },

    getTemplate: function(name, eagerCompile, callback) {
        if(name && name.raw) {
            // this fixes autoescape for templates referenced in symbols
            name = name.raw;
        }

        if(lib.isFunction(eagerCompile)) {
            callback = eagerCompile;
            eagerCompile = false;
        }

        var self = this;
        var info = null;
        var tmpl = this.cache[name];

        if(typeof name !== 'string') {
            throw new Error('template names must be a string: ' + name);
        }

        var finalize = function() {
            callback(null, self.cache[name]);
        };

        var _getTemplate = function() {
            var index = 0;
            var getSource = function (cb) {
                self.loaders[index].getSource(name, function (info) {
                    if (info) {
                        cb(info);
                    } else {
                        (++index < self.loaders.length) ? getSource(cb) : cb(null);
                    }
                });
            };

            getSource(function (info) {
                if (!info) {
                    throw new Error('template not found: ' + name);
                }

                self.cache[name] = new Template(info.src,
                    self,
                    info.path,
                    info.upToDate,
                    eagerCompile);

                callback(null, self.cache[name]);
            });
        };

        if(!tmpl) {
            _getTemplate();
        } else {
            tmpl.upToDate(function (isUpToDate) {
                if (isUpToDate) {
                    finalize();
                } else {
                    _getTemplate();
                }
            });
        }
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

        if(app.render) {
            // Express >2.5.11
            app.render = function(name, ctx, k) {
                var context = {};

                if(lib.isFunction(ctx)) {
                    k = ctx;
                    ctx = {};
                }

                context = lib.extend(context, this.locals);

                if(ctx._locals) {
                    context = lib.extend(context, ctx._locals);
                }

                context = lib.extend(context, ctx);

                env.render(name, context, function(res) {
                    k(null, res);
                });
            };
        }
        else {
            // Express <2.5.11
            var http = require('http');
            var self = this;
            var res = http.ServerResponse.prototype;

            res._render = function(name, ctx, k) {
                var app = this.app;
                var context = {};

                if(this._locals) {
                    context = lib.extend(context, this._locals);
                }

                if(ctx) {
                    context = lib.extend(context, ctx);

                    if(ctx.locals) {
                        context = lib.extend(context, ctx.locals);
                    }
                }

                context = lib.extend(context, app._locals);

                env.render(name, context, function (str) {
                    if (k) {
                        k(null, str);
                    }
                    else {
                        self.send(str);
                    }
                });
            };
        }
    },

    render: function(name, ctx, callback) {
        this.getTemplate(name, function(err, tmpl) {
            tmpl.render(ctx, callback);
        });
    }
});

var Context = Object.extend({
    init: function(ctx, blocks) {
        this.ctx = ctx;
        this.blocks = {};
        this.exported = [];

        for(var name in blocks) {
            this.addBlock(name, blocks[name]);
        }
    },

    lookup: function(name) {
        // This is one of the most called functions, so optimize for
        // the typical case where the name isn't in the globals
        if(name in globals && !(name in this.ctx)) {
            return globals[name];
        }
        else {
            return this.ctx[name];
        }
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

    getSuper: function(env, name, block, frame, runtime, cb) {
        var idx = (this.blocks[name] || []).indexOf(block);
        var blk = this.blocks[name][idx + 1];
        var context = this;

        if(idx == -1 || !blk) {
            throw new Error('no super block available for "' + name + '"');
        }

        blk(env, context, frame, runtime, cb);
    },

    addExport: function(name) {
        this.exported.push(name);
    },

    getExported: function() {
        var exported = {};
        for(var i=0; i<this.exported.length; i++) {
            var name = this.exported[i];
            exported[name] = this.ctx[name];
        }
        return exported;
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
            lib.withPrettyErrors(this.path,
                                 this.env.dev,
                                 this._compile.bind(this));
        }
        else {
            this.compiled = false;
        }
    },

    render: function(ctx, frame, cb) {
        if (typeof ctx === 'function') {
            cb = ctx;
            ctx = {};
        }
        else if (typeof frame === 'function') {
            cb = frame;
            frame = null;
        }

        return lib.withPrettyErrors(this.path, this.env.dev, function() {
            if(!this.compiled) {
                this._compile();
            }

            var context = new Context(ctx || {}, this.blocks);

            this.rootRenderFunc(this.env,
                                context,
                                frame || new Frame(),
                                runtime,
                                cb);
        }.bind(this));
    },

    getExported: function(cb) {
        if(!this.compiled) {
            this._compile();
        }

        // Run the rootRenderFunc to populate the context with exported vars
        var context = new Context({}, this.blocks);
        this.rootRenderFunc(this.env,
                            context,
                            new Frame(),
                            runtime,
                            function() {
                                cb(null, context.getExported());
                            });
    },

    _compile: function() {
        var props;

        if(this.tmplProps) {
            props = this.tmplProps;
        }
        else {
            var source = compiler.compile(this.tmplStr, this.env.extensionsList, this.path);
            var func = new Function(source);
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
// var src = '{{ -3|abs }}';
// var env = new Environment(null, { autoescape: true, dev: true });

// var tmpl = new Template(src, env, null, null, true);
// console.log("OUTPUT ---");

// tmpl.render({ foo: 'numbers' }, function(err, res) {
//     console.log(res);
// });

module.exports = {
    Environment: Environment,
    Template: Template
};
