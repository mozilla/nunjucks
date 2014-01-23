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

    var basicAsyncUpperFilter = function(value, callback) {
        callback(null, value.toUpperCase());
    };

    describe('async', function() {
        it('should support basic async filter', function(done) {
            var env = new Environment();

            env.addFilter('async', basicAsyncUpperFilter, true);

            env.renderString('{{ val | async }}', {
                val: 'Foo Bar'
            }, function (err, res) {
                expect(err).to.be(null);
                expect(res).to.be('FOO BAR');
                done()
            })
        });

        it('should support basic async filter with if negative', function(done) {
            var env = new Environment();

            env.addFilter('async', basicAsyncUpperFilter, true);

            env.renderString('{% if test %}{{ val | async }}{% endif %}oof', {
                test: false,
                val: 'Foo Bar'
            }, function (err, res) {
                expect(err).to.be(null);
                expect(res).to.be('oof');
                done()
            })
        });
    });
})();
