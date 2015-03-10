(function() {
    'use strict';

    var expect, util, Environment, Loader, templatesPath;
    var path = require('path');
    var os = require('os');

    if(typeof require !== 'undefined') {
        expect = require('expect.js');
        util = require('./util');
        Environment = require('../src/environment').Environment;
        Loader = require('../src/node-loaders').FileSystemLoader;
        templatesPath = 'tests/templates';
    }
    else {
        expect = window.expect;
        Environment = nunjucks.Environment;
        Loader = nunjucks.WebLoader;
        templatesPath = '../templates';
    }

    describe('api', function() {
        it('should always force compilation of parent template', function() {
            var env = new Environment(new Loader(templatesPath));

            var parent = env.getTemplate('base.html');
            var child = env.getTemplate('base-inherit.html');
            expect(child.render()).to.be('Foo*Bar*BazFizzle');
        });

        it('should handle correctly relative paths', function() {
            var env = new Environment(new Loader(templatesPath));

            var child1 = env.getTemplate('relative/test1.html');
            var child2 = env.getTemplate('relative/test2.html');

            expect(child1.render()).to.be('FooTest1BazFizzle');
            expect(child2.render()).to.be('FooTest2BazFizzle');
        });

        it('should handle correctly cache for relative paths', function() {
            var env = new Environment(new Loader(templatesPath));

            var test = env.getTemplate('relative/test-cache.html');

            expect(util.normEOL(test.render())).to.be('Test1\nTest2');
        });

        it('should handle correctly relative paths in renderString', function() {
            var env = new Environment(new Loader(templatesPath));
            expect(env.renderString('{% extends "./relative/test1.html" %}{% block block1 %}Test3{% endblock %}', {}, {
                path: path.resolve(templatesPath, 'string.html')
            })).to.be('FooTest3BazFizzle');
        });
    });
})();
