var render = require('./util').render;
var lib = require('../src/lib');

describe('filter', function() {
    it('range', function() {
        render('{% for i in range(0, 10) %}{{ i }}{% endfor %}')
            .should.equal('0123456789');

        render('{% for i in range(10) %}{{ i }}{% endfor %}')
            .should.equal('0123456789');

        render('{% for i in range(5, 10) %}{{ i }}{% endfor %}')
            .should.equal('56789');

        render('{% for i in range(5, 10, 2) %}{{ i }}{% endfor %}')
            .should.equal('579');

        render('{% for i in range(5, 10, 2.5) %}{{ i }}{% endfor %}')
            .should.equal('57.5');

        render('{% for i in range(5, 10, 2.5) %}{{ i }}{% endfor %}')
            .should.equal('57.5');

        // render('{% for i in range(5, 10, -1) %}{{ i }}{% endfor %}')
        //     .should.equal('56789');

        // render('{% for i in range(5, 10, -1 | abs) %}{{ i }}{% endfor %}')
        //     .should.equal('56789');
    });

    // it('lipsum', function() {
    //     render('{{ lipsum() }}').should.equal('lip');
    // });

    it('cycler', function() {
        render('{% set cls = cycler("odd", "even") %}' +
               '{{ cls.next() }}' +
               '{{ cls.next() }}' +
               '{{ cls.next() }}')
            .should.equal('oddevenodd');

        render('{% set cls = cycler("odd", "even") %}' +
               '{{ cls.next() }}' +
               '{{ cls.reset() }}' +
               '{{ cls.next() }}')
            .should.equal('oddodd');
    });

    it('joiner', function() {
        render('{% set comma = joiner() %}' +
               'foo{{ comma() }}bar{{ comma() }}baz{{ comma() }}')
            .should.equal('foobar,baz,');

        render('{% set pipe = joiner("|") %}' +
               'foo{{ pipe() }}bar{{ pipe() }}baz{{ pipe() }}')
            .should.equal('foobar|baz|');
    });
});
