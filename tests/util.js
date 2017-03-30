(function() {
    'use strict';

    var nunjucks, Environment, Template, Loader, templatesPath, expect;

    if(typeof require !== 'undefined') {
        nunjucks = require('../index.js');
        Loader = nunjucks.FileSystemLoader;
        templatesPath = 'tests/templates';
        expect = require('expect.js');
    }
    else {
        Loader = nunjucks.WebLoader;
        templatesPath = '../templates';
        expect = window.expect;
    }
    Environment = nunjucks.Environment;
    Template = nunjucks.Template;

    var numAsyncs;
    var doneHandler;

    beforeEach(function() {
        numAsyncs = 0;
        doneHandler = null;
    });

    function equal(str, ctx, str2, env) {
        if(typeof ctx === 'string') {
            env = str2;
            str2 = ctx;
            ctx = null;
        }

        var res = render(str, ctx, {}, env);
        expect(res).to.be(str2);
    }

    function jinjaEqual(str, ctx, str2, env) {
        var jinjaUninstall = nunjucks.installJinjaCompat();
        try {
            return equal(str, ctx, str2, env);
        } finally {
            jinjaUninstall();
        }
    }

    function finish(done) {
        if(numAsyncs > 0) {
            doneHandler = done;
        }
        else {
            done();
        }
    }

    function normEOL(str) {
        if (!str) return str;
        return str.replace(/\r\n|\r/g, '\n');
    }

    function render(str, ctx, opts, env, cb) {
        if(typeof ctx === 'function') {
            cb = ctx;
            ctx = null;
            opts = null;
            env = null;
        }
        else if(typeof opts === 'function') {
            cb = opts;
            opts = null;
            env = null;
        }
        else if(typeof env === 'function') {
            cb = env;
            env = null;
        }

        opts = opts || {};
        opts.dev = true;
        var e = env || new Environment(new Loader(templatesPath), opts);

        var name;
        if(opts.filters) {
            for(name in opts.filters) {
                e.addFilter(name, opts.filters[name]);
            }
        }

        if(opts.asyncFilters) {
            for(name in opts.asyncFilters) {
                e.addFilter(name, opts.asyncFilters[name], true);
            }
        }

        if(opts.extensions) {
            for(name in opts.extensions) {
                e.addExtension(name, opts.extensions[name]);
            }
        }

        ctx = ctx || {};
        var t = new Template(str, e);

        if(!cb) {
            return t.render(ctx);
        }
        else {
            numAsyncs++;
            t.render(ctx, function(err, res) {
                if(err && !opts.noThrow) {
                    throw err;
                }

                cb(err, normEOL(res));

                numAsyncs--;

                if(numAsyncs === 0 && doneHandler) {
                    doneHandler();
                }
            });
        }
    }

    if(typeof module !== 'undefined') {
        module.exports.render = render;
        module.exports.equal = equal;
        module.exports.jinjaEqual = jinjaEqual;
        module.exports.finish = finish;
        module.exports.normEOL = normEOL;
    }
    else {
        window.util = {
            render: render,
            equal: equal,
            jinjaEqual: jinjaEqual,
            finish: finish,
            normEOL: normEOL
        };
    }
})();
