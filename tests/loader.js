(function() {
    'use strict';

    var expect, Environment, WebLoader, FileSystemLoader, templatesPath;

    if(typeof require !== 'undefined') {
        expect = require('expect.js');
        Environment = require('../src/environment').Environment;
        WebLoader = require('../src/web-loaders').WebLoader;
        FileSystemLoader = require('../src/node-loaders').FileSystemLoader;
        templatesPath = 'tests/templates';
    }
    else {
        expect = window.expect;
        Environment = nunjucks.Environment;
        WebLoader = nunjucks.WebLoader;
        FileSystemLoader = nunjucks.FileSystemLoader;
        templatesPath = '../templates';
    }

    describe('loader', function() {
        it('should have default opts', function() {
            var webLoader = new WebLoader(templatesPath);
            var fileSystemLoader = new FileSystemLoader(templatesPath);
            expect(webLoader).to.be.a(WebLoader);
            expect(webLoader.useCache).to.be(false);
            expect(webLoader.async).to.be(false);
            expect(fileSystemLoader).to.be.a(FileSystemLoader);
            expect(fileSystemLoader.noCache).to.be(false);
        });

        it('should allow a simple loader to be created', function() {
            // From Docs: http://mozilla.github.io/nunjucks/api.j2#writing-a-loader
            // We should be able to create a loader that only exposes getSource
            function MyLoader() {
                // configuration
            }

            MyLoader.prototype.getSource = function() {
                return { src: 'Hello World',
                            path: '/tmp/somewhere' };
            };

            var env = new Environment(new MyLoader(templatesPath));
            var parent = env.getTemplate('fake.j2');
            expect(parent.render()).to.be('Hello World');
        });

        it('should catch loader error', function(done) {
            // From Docs: http://mozilla.github.io/nunjucks/api.j2#writing-a-loader
            // We should be able to create a loader that only exposes getSource
            function MyLoader() {
                // configuration
                this.async = true;
            }

            MyLoader.prototype.getSource = function(s, cb) {
                setTimeout(function() {
                    cb(new Error('test'));
                }, 1);
            };

            var env = new Environment(new MyLoader(templatesPath));
            env.getTemplate('fake.j2', function(err, parent) {
                expect(err).to.be.a(Error);
                expect(parent).to.be(undefined);

                done();
            });

        });
    });
})();
