(function() {
    var expect, Environment, Loader, templatesPath;

    if(typeof require != 'undefined') {
        expect = require('expect.js');
        Environment = require('../src/environment').Environment;
        templatesPath = 'tests/templates';
    }
    else {
        expect = window.expect;
        Environment = nunjucks.Environment;
        Loader = nunjucks.WebLoader;
        templatesPath = '../templates';
    }

    describe('loader', function() {
        it('should allow a simple loader to be created', function() {
            // From Docs: http://mozilla.github.io/nunjucks/api.html#writing-a-loader
            // We should be able to create a loader that only exposes getSource
            function MyLoader(opts) {
                // configuration
            }

            MyLoader.prototype.getSource = function(name) {
                return { src: "Hello World",
                            path: "/tmp/somewhere" };
            };

            var env = new Environment(new MyLoader(templatesPath));
            var parent = env.getTemplate('fake.html');
            expect(parent.render()).to.be('Hello World');
        });
    });
})();
