(function() {
    var expect, util;

    if(typeof require != 'undefined') {
        expect = require('expect.js');
        util = require('./util');
    }
    else {
        expect = window.expect;
        util = window.util;
    }

    var equal = util.equal;
    var finish = util.finish;
    var render = util.render;

    describe('runtime', function() {
        it('should report the failed function calls to symbols', function(done) {
            render('{{ foo("cvan") }}', {}, { noThrow: true }, function(err) {
                expect(err).to.match(/Unable to call `foo`, which is undefined/);
            });

            finish(done);
        });

        it('should report the failed function calls to lookups', function(done) {
            render('{{ foo["bar"]("cvan") }}', {}, { noThrow: true }, function(err) {
                expect(err).to.match(/foo\["bar"\]/);
            });

            finish(done);
        });

        it('should report the failed function calls to calls', function(done) {
            render('{{ foo.bar("second call") }}', {}, { noThrow: true }, function(err) {
                expect(err).to.match(/foo\["bar"\]/);
            });

            finish(done);
        });

        it('should report the failed function calls w/multiple args', function(done) {
            render('{{ foo.bar("multiple", "args") }}', {}, { noThrow: true }, function(err) {
                expect(err).to.match(/foo\["bar"\]/);
            });

            render('{{ foo["bar"]["zip"]("multiple", "args") }}',
                   {},
                   { noThrow: true },
                   function(err) {
                       expect(err).to.match(/foo\["bar"\]\["zip"\]/);
                   });

            finish(done);
        });

        it('should allow for undefined macro arguments in the last position', function(done) {
            render('{% macro foo(bar, baz) %}' +
                   '{{ bar }} {{ baz }}{% endmacro %}' +
                   '{{ foo("hello", none) }}',
                   {},
                   { noThrow: true },
                   function(err, res) {
                       expect(err).to.equal(null);
                       expect(typeof res).to.be('string');
                   });

            finish(done);
        });
    });
})();
