
var render = require('./util').render;
var lib = require('../src/lib');

describe('filter', function() {
    it('abs', function(done) {
        render('{{ -3|abs }}', function(s) {
            s.should.equal('3');
            done();
        })
    });
    it('abs', function (done) {
        render('{{ -3.456|abs }}',function (s) {
            s.should.equal('3.456');
            done();
        })
    });

    it('batch', function(done) {
        render('{% for a in [1,2,3,4,5,6]|batch(2) %}' +
               '-{% for b in a %}' +
               '{{ b }}' +
               '{% endfor %}-' +
               '{% endfor %}',
               function (s) {
                   s.should.equal('-12--34--56-');
                   done();
               });
    });

    it('capitalize', function(done) {
        render('{{ "foo" | capitalize }}', function (s) {
            s.should.equal('Foo');
            done();
        });
    });

    it('center', function(done) {
        var s = render('{{ "fooo" | center }}');
        s.should.equal(lib.repeat(' ', 38) + 'fooo' + 
                       lib.repeat(' ', 38));

        s = render('{{ "foo" | center }}');
        s.should.equal(lib.repeat(' ', 38) + 'foo' +
                       lib.repeat(' ', 39));

    });

    it('default', function(done) {
        render('{{ false | default("foo") }}', function (s) {
            s.should.equal('foo');
            done();
        });
    });

    it('default', function (done) {
        render('{{ "bar" | default("foo") }}', function (s) {
            s.should.equal('bar');
            done();
        });
    });

    it('escape', function(done) {
        render('{{ "<html>" | escape }}', function (s) {
            s.should.equal('&lt;html&gt;');
            done();
        });
    });

    it("dictsort", function(done) {
        // no real foolproof way to test that a js obj has been transformed 
        // from unsorted -> sorted, as its enumeration ordering is undefined 
        // and might fluke being sorted originally .. lets just init with some jumbled
        // keys 

        // no params - should be case insensitive, by key
        var s = render('{% for item in items | dictsort %}' +
                           '{{ item[0] }}{% endfor %}', { 
            items: { 
                "e": 1,  
                "d": 2,
                "c": 3,
                "a": 4,
                "f": 5,
                "b": 6
            }
        });
        s.should.equal("abcdef");

        // case sensitive = true
        var s = render('{% for item in items | dictsort(true) %}' +
                           '{{ item[0] }},{% endfor %}', { 
            items: { 
                "ABC": 6,
                "ABc": 5,
                "Abc": 1,
                "abc": 2
            }
        });

        s.should.equal("ABC,ABc,Abc,abc,");

        // use values for sort 
        var s = render('{% for item in items | dictsort(false, "value") %}' +
                           '{{ item[0] }}{% endfor %}', { 
            items: { 
                "a": 6,
                "b": 5,
                "c": 1,
                "d": 2
            }
        });

        s.should.equal("cdba");
    });

    it('first', function(done) {
        render('{{ [1,2,3] | first }}', function (s) {
            s.should.equal('1');
            done();
        });
    });

    it('float/int', function (done) {
        render('{{ "3.5" | float }}', function (s) {
            s.should.equal('3.5');
            done();
        });
    });

    it('float/int', function (done) {
        render('{{ "3.5" | int }}', function (s) {
            s.should.equal('3');
            done();
        });
    });

    it('float/int', function (done) {
        render('{{ "0" | int }}', function (s) {
            s.should.equal('0');
            done();
        });
    });

    it('float/int', function (done) {
        render('{{ "0" | float }}', function (s) {
            s.should.equal('0');
            done();
        });
    });

    it('float/int', function (done) {
        render('{{ "bob" | int("cat") }}', function (s) {
            s.should.equal('cat');
            done();
        });
    });

    it('float/int', function (done) {
        render('{{ "bob" | float("cat") }}', function (s) {
            s.should.equal('cat');
            done();
        });
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

    it('indent', function(done) {
        render('{{ "one\ntwo\nthree" | indent }}', function(s) {
            s.should.equal('one\n    two\n    three\n');
            done();
        });
    });
    it('indent', function (done) {
        render('{{ "one\ntwo\nthree" | indent(2) }}', function (s) {
            s.should.equal('one\n  two\n  three\n');
            done();
        });
    });
    it('indent', function (done) {
        render('{{ "one\ntwo\nthree" | indent(2, true) }}', function (s) {
            s.should.equal('  one\n  two\n  three\n');
            done();
        });
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

    it('last', function(done) {
        render('{{ [1,2,3] | last }}', function (s) {
            s.should.equal('3');
            done();
        });
    });

    it('length', function(done) {
        render('{{ [1,2,3] | length }}', function (s) {
            s.should.equal('3');
            done();
        });
    });

    it('list', function() {
        var s = render('{% for i in "foobar" | list %}{{ i }},{% endfor %}');
        s.should.equal('f,o,o,b,a,r,');
    });

    it('lower', function(done) {
        render('{{ "fOObAr" | lower }}', function (s) {
            s.should.equal('foobar');
            done();
        });
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

    it('truncate', function() {
        var s = render('{{ "foo bar" | truncate(3) }}');
        s.should.equal('foo...');

        var s = render('{{ "foo bar baz" | truncate(6) }}');
        s.should.equal('foo...');

        var s = render('{{ "foo bar baz" | truncate(7) }}');
        s.should.equal('foo bar...');

        var s = render('{{ "foo bar baz" | truncate(5, true) }}');
        s.should.equal('foo b...');

        var s = render('{{ "foo bar baz" | truncate(6, true, "?") }}');
        s.should.equal('foo ba?');
    });

    it('upper', function(done) {
        render('{{ "foo" | upper }}', function(s) {
            s.should.equal('FOO');
            done();
        });
    });

    it('wordcount', function(done) {
        render('{{ "foo bar baz" | wordcount }}', function (s) {
            s.should.equal('3');
            done();
        });
    });
});
