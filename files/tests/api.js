(function() {
    var expect, Environment, Loader, templatesPath;

    if(typeof require != 'undefined') {
        expect = require('expect.js');
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
    });
})();
