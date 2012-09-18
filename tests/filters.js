
var render = require('./util').render;
var lib = require('../src/lib');

describe('filter', function() {
    it('abs', function() {
        render('{{ -3|abs }}').should.equal('3');
        render('{{ -3.456|abs }}').should.equal('3.456');
    });

    it('batch', function() {
        render('{% for a in [1,2,3,4,5,6]|batch(2) %}' +
               '-{% for b in a %}' +
               '{{ b }}' +
               '{% endfor %}-' +
               '{% endfor %}')
            .should.equal('-12--34--56-');
    });

    it('capitalize', function() {
        var s = render('{{ "foo" | capitalize }}');
        s.should.equal('Foo');
    });

    it('center', function() {
        var s = render('{{ "fooo" | center }}');
        s.should.equal(lib.repeat(' ', 38) + 'fooo' + 
                       lib.repeat(' ', 38));

        s = render('{{ "foo" | center }}');
        s.should.equal(lib.repeat(' ', 38) + 'foo' +
                       lib.repeat(' ', 39));

    });

    it('default', function() {
        var s = render('{{ false | default("foo") }}');
        s.should.equal('foo');

        s = render('{{ "bar" | default("foo") }}');
        s.should.equal('bar');
    });

    it('escape', function() {
        var s = render('{{ "<html>" | escape }}');
        s.should.equal('&lt;html&gt;');
    });

    it('first', function() {
        var s = render('{{ [1,2,3] | first }}');
        s.should.equal('1');
    });

    it('float/int', function() {
        var s = render('{{ "3.5" | float }}');
        s.should.equal('3.5');

        var s = render('{{ "3.5" | int }}');
        s.should.equal('3');
    });

    it('groupby', function() {
        var s = render('{% for type, items in items | groupby("type") %}' +
                       ':{{ type }}:' +
                       '{% for item in items %}' +
                       '{{ item.name }}' +
                       '{% endfor %}' +
                       '{% endfor %}',
                       { items: [{ name: 'james',
                                   type: 'green' },
                                 { name: 'john',
                                   type: 'blue' },
                                 { name: 'jim',
                                   type: 'blue' },
                                 { name: 'jessie',
                                   type: 'green' }]});

        s.should.equal(':green:jamesjessie:blue:johnjim');
    });

    it('indent', function() {
        var s = render('{{ "one\ntwo\nthree" | indent }}');
        s.should.equal('one\n    two\n    three\n');

        s = render('{{ "one\ntwo\nthree" | indent(2) }}');
        s.should.equal('one\n  two\n  three\n');

        s = render('{{ "one\ntwo\nthree" | indent(2, true) }}');
        s.should.equal('  one\n  two\n  three\n');
    });

    it('join', function() {
        var s = render('{{ items | join }}',
                       { items: [1, 2, 3] });
        s.should.equal('123');

        s = render('{{ items | join(",") }}',
                   { items: ['foo', 'bar', 'bear'] });
        s.should.equal('foo,bar,bear');

        s = render('{{ items | join(",", "name") }}',
                   { items: [{ name: 'foo' },
                             { name: 'bar' },
                             { name: 'bear' }] });
        s.should.equal('foo,bar,bear');
    });

    it('last', function() {
        var s = render('{{ [1,2,3] | last }}');
        s.should.equal('3');
    });

    it('length', function() {
        var s = render('{{ [1,2,3] | length }}');
        s.should.equal('3');        
    });

    it('list', function() {
        var s = render('{% for i in "foobar" | list %}{{ i }},{% endfor %}');
        s.should.equal('f,o,o,b,a,r,');
    });

    it('lower', function() {
        var s = render('{{ "fOObAr" | lower }}');
        s.should.equal('foobar');
    });

    it('random', function() {
        for(var i=0; i<100; i++) {
            var s = render('{{ [1,2,3,4,5,6,7,8,9] | random }}');
            var val = parseInt(s);
            val.should.be.within(1, 9);
        }
    });

    it('replace', function() {
        var s = render('{{ "aaabbbccc" | replace("a", "x") }}');
        s.should.equal('xxxbbbccc');

        s = render('{{ "aaabbbccc" | replace("a", "x", 2) }}');
        s.should.equal('xxabbbccc');

        s = render('{{ "aaabbbbbccc" | replace("b", "y", 4) }}');
        s.should.equal('aaayyyybccc');
    });

    it('reverse', function() {
        var s = render('{{ "abcdef" | reverse }}');
        s.should.equal('fedcba');

        s = render('{% for i in [1, 2, 3, 4] | reverse %}{{ i }}{% endfor %}');
        s.should.equal('4321');
    });

    it('round', function() {
        var s = render('{{ 4.5 | round }}');
        s.should.equal('5');

        s = render('{{ 4.5 | round(0, "floor") }}');
        s.should.equal('4');

        s = render('{{ 4.12345 | round(4) }}');
        s.should.equal('4.1235');

        s = render('{{ 4.12344 | round(4) }}');
        s.should.equal('4.1234');
    });

    it('slice', function() {
        var tmpl = '{% for items in arr | slice(3) %}' +
            '--' +
            '{% for item in items %}' +
            '{{ item }}' +
            '{% endfor %}' +
            '--' +
            '{% endfor %}';

        var s = render(tmpl,
                      { arr: [1,2,3,4,5,6,7,8,9] });
        s.should.equal('--123----456----789--');

        s = render(tmpl,
                   { arr: [1,2,3,4,5,6,7,8,9,10] });
        s.should.equal('--1234----567----8910--');
    });

    it('sort', function() {
        var s = render('{% for i in [3,5,2,1,4,6] | sort %}{{ i }}{% endfor %}');
        s.should.equal('123456');

        s = render('{% for i in ["fOo", "Foo"] | sort %}{{ i }}{% endfor %}');
        s.should.equal('fOoFoo');

        s = render('{% for i in [1,6,3,7] | sort(true) %}' +
                   '{{ i }}{% endfor %}');
        s.should.equal('7631');

        s = render('{% for i in ["fOo", "Foo"] | sort(false, true) %}' +
                   '{{ i }}{% endfor %}');
        s.should.equal('FoofOo');

        s = render('{% for item in items | sort(false, false, "name") %}' +
                   '{{ item.name }}{% endfor %}',
                   { items: [{ name: 'james' },
                             { name: 'fred' },
                             { name: 'john' }]});
        s.should.equal('fredjamesjohn');
    });

    it('string', function() {
        var s = render('{% for i in 1234 | string | list %}{{ i }},{% endfor %}');
        s.should.equal('1,2,3,4,');
    });

    it('trim', function() {
        var s = render('{{ "  foo " | trim }}');
        s.should.equal('foo');
    });

    it('upper', function() {
        var s = render('{{ "foo" | upper }}');
        s.should.equal('FOO');
    });

    it('wordcount', function() {
        var s = render('{{ "foo bar baz" | wordcount }}');
        s.should.equal('3');
    });
});
