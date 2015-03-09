'use strict';

var fs = require('fs');
var bench = require('bench');
var oldNunjucks = require('nunjucks');
var nunjucks = require('../index');

var src = fs.readFileSync('case.html', 'utf-8');

var oldEnv = new oldNunjucks.Environment(null);
var oldTmpl = new oldNunjucks.Template(src, env, null, null, true);

var env = new nunjucks.Environment(null);
var tmpl = new nunjucks.Template(src, env, null, null, true);

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
    'old-nunjucks': function() {
        oldTmpl.render(ctx);
    },

    'new-nunjucks': function(done) {
        tmpl.render(ctx, done);
    }
};

// var start = Date.now();
// function g() {}

// for(var i=0; i<3000; i++) {
//     oldTmpl.render(ctx);
//     //tmpl.render(ctx, g);
// }

// console.log(Date.now() - start);

bench.runMain();
