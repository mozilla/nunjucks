(function() {
    var Environment, Template, loader, templatesPath, expect, lib;

    if(typeof require != 'undefined') {
        Environment = require('../src/environment').Environment;
        Template = require('../src/environment').Template;
        loader = require('../src/node-loaders').FileSystemLoader;
        templatesPath = 'tests/templates';
        expect = require('expect.js');
        lib = require('../src/lib');
    }
    else {
        Environment = nunjucks.Environment;
        Template = nunjucks.Template;
        loader = nunjucks.HttpLoader;
        templatesPath = '../templates';
        expect = window.expect;
        lib = window.lib;
    }

    var numAsyncs;
    var doneAsyncs;
    var doneHandler;

    beforeEach(function() {
        doneAsyncs = 0;
        numAsyncs = 0;
        doneHandler = null;
    });

    function equal(str, ctx, str2) {
        if(typeof ctx === 'string') {
            str2 = ctx;
            ctx = null;
        }

        render(str, ctx, null, function(err, res) {
            if(err) {
                throw err;
            }

            expect(res).to.be(str2);
        });
    }

    function finish(done) {
        doneHandler = done;
    }

    function render(str, ctx, opts, cb) {
        if(lib.isFunction(ctx)) {
            cb = ctx;
            ctx = null;
            opts = null;
        }
        else if(lib.isFunction(opts)) {
            cb = opts;
            opts = null;
        }

        opts = opts || { dev: true };
        var e = new Environment(new loader(templatesPath), opts);

        if(opts.filters) {
            for(var name in opts.filters) {
                e.addFilter(name, opts.filters[name]);
            }        
        }

        if(opts.asyncFilters) {
            for(var name in opts.asyncFilters) {
                e.addFilter(name, opts.asyncFilters[name], true);
            }        
        }

        if(opts.extensions) {
            for(var name in opts.extensions) {
                e.addExtension(name, opts.extensions[name]);
            }
        }

        ctx = ctx || {};
        numAsyncs++;
        var t = new Template(str, e);

        return t.render(ctx, function(err, res) {
            setTimeout(function() {
                if(err && !opts.noThrow) {
                    throw err;
                }

                cb(err, res);

                doneAsyncs++;

                if(numAsyncs == doneAsyncs && doneHandler) {
                    doneHandler();
                }
            }, 0);
        });
    }

    if(typeof module != 'undefined') {
        module.exports.render = render;
        module.exports.equal = equal;
        module.exports.finish = finish;
    }
    else {
        window.render = render;
        window.equal = equal;
        window.finish = finish;
    }
})();
