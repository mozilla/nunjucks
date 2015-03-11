(function() {
    'use strict';

    var Environment, Template, loader, templatesPath, expect;

    if(typeof require !== 'undefined') {
        Environment = require('../src/environment').Environment;
        Template = require('../src/environment').Template;
        loader = require('../src/node-loaders').FileSystemLoader;
        templatesPath = 'tests/templates';
        expect = require('expect.js');
    }
    else {
        Environment = nunjucks.Environment;
        Template = nunjucks.Template;
        loader = nunjucks.WebLoader;
        templatesPath = '../templates';
        expect = window.expect;
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

        render(str, ctx, {}, function(err, res) {
            if(err) {
                throw err;
            }

            expect(res).to.be(str2);
        });
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
        return str.replace(/\r\n|\r/g, "\n");
    }

    function render(str, ctx, opts, cb) {
        if(!opts) {
            cb = ctx;
            ctx = null;
            opts = null;
        }
        else if(!cb) {
            cb = opts;
            opts = null;
        }

        opts = opts || {};
        opts.dev = true;
        var e = new Environment(new loader(templatesPath, true), opts);

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

                cb(err, normEOL(res));

                doneAsyncs++;

                if(numAsyncs === doneAsyncs && doneHandler) {
                    doneHandler();
                }
            }, 0);
        });
    }

    if(typeof module !== 'undefined') {
        module.exports.render = render;
        module.exports.equal = equal;
        module.exports.finish = finish;
        module.exports.normEOL = normEOL;
    }
    else {
        window.util = {
            render: render,
            equal: equal,
            finish: finish,
            normEOL: normEOL
        };
    }
})();
