(function() {
    var expect, render;

    if(typeof require != 'undefined') {
        expect = require('expect.js');
        render = require('./util').render;
    }
    else {
        expect = window.expect;
        render = window.render;
    }

    describe('runtime', function() {
        it('should report the failed function calls to symbols', function() {
            expect(function() {
                render('{{ foo("cvan") }}');
            }).to.throwException(/Unable to call `foo`, which is undefined/);
        });

        it('should report the failed function calls to lookups', function() {
            expect(function() {
                render('{{ foo["bar"]("cvan") }}');
            }).to.throwException(/foo\["bar"\]/);
        });

        it('should report the failed function calls to calls', function() {
            expect(function() {
                render('{{ foo.bar("second call") }}');
            }).to.throwException(/foo\["bar"\]/);
        });

        it('should report the failed function calls w/multiple args', function() {
            expect(function() {
                render('{{ foo.bar("multiple", "args") }}');
            }).to.throwException(/foo\["bar"\]/);

            expect(function() {
                render('{{ foo["bar"]["zip"]("multiple", "args") }}');
            }).to.throwException(/foo\["bar"\]\["zip"\]/);
        });

        it('should allow for undefined macro arguments in the last position', function() {
            expect(function() {
                render('{% macro foo(bar, baz) %}' +
                       '{{ bar }} {{ baz }}{% endmacro %}' +
                       '{{ foo("hello", none) }}');
            }).to.not.throwException();
        });
    });
})();
