(function() {
    var expect, util, lib;

    if(typeof require != 'undefined') {
        expect = require('expect.js');
        util = require('./util');
        lib = require('../src/lib');
    }
    else {
        expect = window.expect;
        util = window.util;
        lib = nunjucks.require('lib');
    }

    var equal = util.equal;
    var finish = util.finish;

    describe('global', function() {
        it('should have range', function(done) {
            equal('{% for i in range(0, 10) %}{{ i }}{% endfor %}', '0123456789');
            equal('{% for i in range(10) %}{{ i }}{% endfor %}', '0123456789');
            equal('{% for i in range(5, 10) %}{{ i }}{% endfor %}', '56789');
            equal('{% for i in range(5, 10, 2) %}{{ i }}{% endfor %}', '579');
            equal('{% for i in range(5, 10, 2.5) %}{{ i }}{% endfor %}', '57.5');
            equal('{% for i in range(5, 10, 2.5) %}{{ i }}{% endfor %}', '57.5');

            //equal('{% for i in range(5, 10, -1) %}{{ i }}{% endfor %}', '56789');
            //equal('{% for i in range(5, 10, -1 | abs) %}{{ i }}{% endfor %}','56789');

            finish(done);
        });

        it('should have cycler', function(done) {
            equal('{% set cls = cycler("odd", "even") %}' +
                  '{{ cls.next() }}' +
                  '{{ cls.next() }}' +
                  '{{ cls.next() }}',
                  'oddevenodd');

            equal('{% set cls = cycler("odd", "even") %}' +
                  '{{ cls.next() }}' +
                  '{{ cls.reset() }}' +
                  '{{ cls.next() }}',
                  'oddodd');

            finish(done);
        });

        it('should have joiner', function(done) {
            equal('{% set comma = joiner() %}' +
                          'foo{{ comma() }}bar{{ comma() }}baz{{ comma() }}',
                  'foobar,baz,');

            equal('{% set pipe = joiner("|") %}' +
                  'foo{{ pipe() }}bar{{ pipe() }}baz{{ pipe() }}',
                  'foobar|baz|');

            finish(done);
        });
    });
})();
