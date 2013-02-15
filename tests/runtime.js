var should = require('should');
var render = require('./util').render;


describe('runtime', function() {
    it('should report the failed function calls to symbols', function() {
        (function() {render(
            '{{ foo("cvan") }}'
        )}).should.throw(/Could not find value "foo" to call./);
    });

    it('should report the failed function calls to lookups', function() {
        (function() {render(
            '{{ foo["bar"]("cvan") }}'
        )}).should.throw(/foo\["bar"\]/);
    });

    it('should report the failed function calls to calls', function() {
        (function() {render(
            '{{ foo.bar("second call") }}'
        )}).should.throw(/foo\["bar"\]/);
    });

    it('should report the failed function calls w/multiple args', function() {
        (function() {render(
            '{{ foo.bar("multiple", "args") }}'
        )}).should.throw(/foo\["bar"\]/);
    });

    it('should report the failed function calls to filters', function() {
        (function() {render(
            '{{ foo["bar"]["zip"]("multiple", "args") }}'
        )}).should.throw(/foo\["bar"\]\["zip"\]/);
    });

});
