(function() {
    'use strict';

    var expect, Environment;

    if(typeof require !== 'undefined') {
        expect = require('expect.js');
        Environment = require('../src/environment').Environment;
    } else {
        expect = window.expect;
        Environment = nunjucks.Environment;
    }

    describe('Environment', function() {
        describe('.clone', function() {
            it('should clone original opts', function() {
                var original = new Environment(null, { dev: true, trimBlocks: false });
                var clone = original.clone();

                expect(clone.opts.dev).to.be(true);
                expect(clone.opts.trimBlocks).to.be(false);
            });

            it('should copy the default & added filters', function() {
                var filter = function() {};
                var original = new Environment();
                original.addFilter('stuff', filter);
                var clone = original.clone();

                expect(Object.keys(clone.filters).length).equal(Object.keys(original.filters).length);
                expect(clone.getFilter('stuff')).equal(filter);
            });

            it('should copy the default & added globals', function() {
                var fn = function() {};
                var original = new Environment();
                original.addGlobal('stuff', fn);
                var clone = original.clone();

                expect(Object.keys(clone.globals).length).equal(Object.keys(original.globals).length);
                expect(clone.getGlobal('stuff')).equal(fn);
            });

            it('should copy existing extensions', function() {
                var fn = function() {};
                var original = new Environment();
                original.addExtension('stuff', fn);
                var clone = original.clone();

                expect(Object.keys(clone.extensions).length).equal(1);
                expect(clone.getExtension('stuff')).equal(fn);
            });

            it('should clone loaders', function() {
              var original = new Environment();
              var originalLoader = original.loaders[0];
              originalLoader._testMark = true;
              originalLoader.cache.someTemplate = 'a cache';

              var clone = original.clone();

              expect(clone.loaders.length).equal(1);
              expect(clone.loaders[0]._testMark).equal(true);
              expect(Object.keys(clone.loaders[0].cache).length).equal(0);
              expect(original.loaders[0].cache.someTemplate).equal('a cache');
            });
        });
    });
})();
