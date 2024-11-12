'use strict';

var fs = require('fs');
var bench = require('bench');
var nunjucks = require('nunjucks');
var govjucks = require('../index');

var src = fs.readFileSync('case.html', 'utf-8');

var oldEnv = new nunjucks.Environment(null);
var oldTmpl = new nunjucks.Template(src, oldEnv, null, null, true);

var env = new govjucks.Environment(null);
var tmpl = new govjucks.Template(src, env, null, null, true);

var ctx = {
    items: [
        {
            current: true,
            name: 'James'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        },
        {
            name: 'Foo',
            url: 'http://example.com'
        }
    ]
};

exports.time = 1000;
exports.compareCount = 8;

exports.compare = {
    'nunjucks': function() {
        oldTmpl.render(ctx);
    },

    'govjucks': function(done) {
        tmpl.render(ctx, done);
    }
};

bench.runMain();
