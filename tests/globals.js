(function() {
    var expect, render, lib;

    if(typeof require != 'undefined') {
        expect = require('expect.js');
        render = require('./util').render;
        lib = require('../src/lib');
    }
    else {
        expect = window.expect;
        render = window.render;
        lib = nunjucks.require('lib');
    }

    describe('global', function() {
        it('should have range', function() {
            expect(render('{% for i in range(0, 10) %}{{ i }}{% endfor %}'))
                .to.be('0123456789');

            expect(render('{% for i in range(10) %}{{ i }}{% endfor %}'))
                .to.be('0123456789');

            expect(render('{% for i in range(5, 10) %}{{ i }}{% endfor %}'))
                .to.be('56789');

            expect(render('{% for i in range(5, 10, 2) %}{{ i }}{% endfor %}'))
                .to.be('579');

            expect(render('{% for i in range(5, 10, 2.5) %}{{ i }}{% endfor %}'))
                .to.be('57.5');

            expect(render('{% for i in range(5, 10, 2.5) %}{{ i }}{% endfor %}'))
                .to.be('57.5');

            // render('{% for i in range(5, 10, -1) %}{{ i }}{% endfor %}')
            //     .should.equal('56789');

            // render('{% for i in range(5, 10, -1 | abs) %}{{ i }}{% endfor %}')
            //     .should.equal('56789');
        });

        // it('lipsum', function() {
        //     render('{{ lipsum() }}').should.equal('lip');
        // });

        it('should have cycler', function() {
            expect(render('{% set cls = cycler("odd", "even") %}' +
                          '{{ cls.next() }}' +
                          '{{ cls.next() }}' +
                          '{{ cls.next() }}'))
                .to.be('oddevenodd');

            expect(render('{% set cls = cycler("odd", "even") %}' +
                          '{{ cls.next() }}' +
                          '{{ cls.reset() }}' +
                          '{{ cls.next() }}'))
                .to.be('oddodd');
        });

        it('should have joiner', function() {
            expect(render('{% set comma = joiner() %}' +
                          'foo{{ comma() }}bar{{ comma() }}baz{{ comma() }}'))
                .to.be('foobar,baz,');

            expect(render('{% set pipe = joiner("|") %}' +
                          'foo{{ pipe() }}bar{{ pipe() }}baz{{ pipe() }}'))
                .to.be('foobar|baz|');
        });
    });
})();
