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

    describe('filter', function() {
        it('abs', function() {
            expect(render('{{ -3|abs }}')).to.be('3');
            expect(render('{{ -3.456|abs }}')).to.be('3.456');
        });

<<<<<<< HEAD
        it('batch', function() {
            var s = render('{% for a in [1,2,3,4,5,6]|batch(2) %}' +
                           '-{% for b in a %}' +
                           '{{ b }}' +
                           '{% endfor %}-' +
                           '{% endfor %}');
            expect(s).to.be('-12--34--56-');
        });

        it('capitalize', function() {
            var s = render('{{ "foo" | capitalize }}');
            expect(s).to.be('Foo');
        });

        it('center', function() {
            var s = render('{{ "fooo" | center }}');
            expect(s).to.be(lib.repeat(' ', 38) + 'fooo' + 
                            lib.repeat(' ', 38));

            s = render('{{ "foo" | center }}');
            expect(s).to.be(lib.repeat(' ', 38) + 'foo' +
                            lib.repeat(' ', 39));
        });

        it('default', function() {
            var s = render('{{ false | default("foo") }}');
            expect(s).to.be('foo');
=======
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
>>>>>>> devoidfury/async_templates

            s = render('{{ "bar" | default("foo") }}');
            expect(s).to.be('bar');
        });

        it('escape', function() {
            var s = render('{{ "<html>" | escape }}');
            expect(s).to.be('&lt;html&gt;');
        });

        it("dictsort", function() {
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
            expect(s).to.be("abcdef");

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

            expect(s).to.be("ABC,ABc,Abc,abc,");

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

            expect(s).to.be("cdba");
        });

        it('first', function() {
            var s = render('{{ [1,2,3] | first }}');
            expect(s).to.be('1');
        });

<<<<<<< HEAD
        it('float/int', function() {
            var s = render('{{ "3.5" | float }}');
            expect(s).to.be('3.5');

            s = render('{{ "3.5" | int }}');
            expect(s).to.be('3');

            s = render('{{ "0" | int }}');
            expect(s).to.be('0');

            s = render('{{ "0" | float }}');
            expect(s).to.be('0');

            s = render('{{ "bob" | int("cat") }}');
            expect(s).to.be('cat');

            s = render('{{ "bob" | float("cat") }}');
            expect(s).to.be('cat');
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

            expect(s).to.be(':green:jamesjessie:blue:johnjim');
        });
=======
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
>>>>>>> devoidfury/async_templates

        it('indent', function() {
            var s = render('{{ "one\ntwo\nthree" | indent }}');
            expect(s).to.be('one\n    two\n    three\n');

<<<<<<< HEAD
            s = render('{{ "one\ntwo\nthree" | indent(2) }}');
            expect(s).to.be('one\n  two\n  three\n');

            s = render('{{ "one\ntwo\nthree" | indent(2, true) }}');
            expect(s).to.be('  one\n  two\n  three\n');
        });

        it('join', function() {
            var s = render('{{ items | join }}',
                           { items: [1, 2, 3] });
            expect(s).to.be('123');
=======
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
>>>>>>> devoidfury/async_templates

            s = render('{{ items | join(",") }}',
                       { items: ['foo', 'bar', 'bear'] });
            expect(s).to.be('foo,bar,bear');

            s = render('{{ items | join(",", "name") }}',
                       { items: [{ name: 'foo' },
                                 { name: 'bar' },
                                 { name: 'bear' }] });
            expect(s).to.be('foo,bar,bear');
        });

        it('last', function() {
            var s = render('{{ [1,2,3] | last }}');
            expect(s).to.be('3');
        });

<<<<<<< HEAD
        it('length', function() {
            var s = render('{{ [1,2,3] | length }}');
            expect(s).to.be('3');        
        });

        it('list', function() {
            var s = render('{% for i in "foobar" | list %}{{ i }},{% endfor %}');
            expect(s).to.be('f,o,o,b,a,r,');
        });
=======
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
>>>>>>> devoidfury/async_templates

        it('lower', function() {
            var s = render('{{ "fOObAr" | lower }}');
            expect(s).to.be('foobar');
        });

<<<<<<< HEAD
        it('random', function() {
            for(var i=0; i<100; i++) {
                var s = render('{{ [1,2,3,4,5,6,7,8,9] | random }}');
                var val = parseInt(s);
                expect(val).to.be.within(1, 9);
            }
        });
=======
    it('lower', function(done) {
        render('{{ "fOObAr" | lower }}', function (s) {
            s.should.equal('foobar');
            done();
        });
    });
>>>>>>> devoidfury/async_templates

        it('replace', function() {
            var s = render('{{ "aaabbbccc" | replace("a", "x") }}');
            expect(s).to.be('xxxbbbccc');

            s = render('{{ "aaabbbccc" | replace("a", "x", 2) }}');
            expect(s).to.be('xxabbbccc');

            s = render('{{ "aaabbbbbccc" | replace("b", "y", 4) }}');
            expect(s).to.be('aaayyyybccc');
        });

        it('reverse', function() {
            var s = render('{{ "abcdef" | reverse }}');
            expect(s).to.be('fedcba');

            s = render('{% for i in [1, 2, 3, 4] | reverse %}{{ i }}{% endfor %}');
            expect(s).to.be('4321');
        });

        it('round', function() {
            var s = render('{{ 4.5 | round }}');
            expect(s).to.be('5');

            s = render('{{ 4.5 | round(0, "floor") }}');
            expect(s).to.be('4');

            s = render('{{ 4.12345 | round(4) }}');
            expect(s).to.be('4.1235');

            s = render('{{ 4.12344 | round(4) }}');
            expect(s).to.be('4.1234');
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
            expect(s).to.be('--123----456----789--');

            s = render(tmpl,
                       { arr: [1,2,3,4,5,6,7,8,9,10] });
            expect(s).to.be('--1234----567----8910--');
        });

        it('sort', function() {
            var s = render('{% for i in [3,5,2,1,4,6] | sort %}{{ i }}{% endfor %}');
            expect(s).to.be('123456');

            s = render('{% for i in ["fOo", "Foo"] | sort %}{{ i }}{% endfor %}');
            expect(s).to.be('fOoFoo');

            s = render('{% for i in [1,6,3,7] | sort(true) %}' +
                       '{{ i }}{% endfor %}');
            expect(s).to.be('7631');

            s = render('{% for i in ["fOo", "Foo"] | sort(false, true) %}' +
                       '{{ i }}{% endfor %}');
            expect(s).to.be('FoofOo');

            s = render('{% for item in items | sort(false, false, "name") %}' +
                       '{{ item.name }}{% endfor %}',
                       { items: [{ name: 'james' },
                                 { name: 'fred' },
                                 { name: 'john' }]});
            expect(s).to.be('fredjamesjohn');
        });

        it('string', function() {
            var s = render('{% for i in 1234 | string | list %}{{ i }},{% endfor %}');
            expect(s).to.be('1,2,3,4,');
        });

        it('title', function() {
            var s = render('{{ "foo bar baz" | title }}');
            expect(s).to.be('Foo Bar Baz');
        });


        it('trim', function() {
            var s = render('{{ "  foo " | trim }}');
            expect(s).to.be('foo');
        });

        it('truncate', function() {
            var s = render('{{ "foo bar" | truncate(3) }}');
            expect(s).to.be('foo...');

            var s = render('{{ "foo bar baz" | truncate(6) }}');
            expect(s).to.be('foo...');

            var s = render('{{ "foo bar baz" | truncate(7) }}');
            expect(s).to.be('foo bar...');

            var s = render('{{ "foo bar baz" | truncate(5, true) }}');
            expect(s).to.be('foo b...');
            
            var s = render('{{ "foo bar baz" | truncate(6, true, "?") }}');
            expect(s).to.be('foo ba?');
        });

<<<<<<< HEAD
        it('upper', function() {
            var s = render('{{ "foo" | upper }}');
            expect(s).to.be('FOO');
        });

        it('wordcount', function() {
            var s = render('{{ "foo bar baz" | wordcount }}');
            expect(s).to.be('3');
=======
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
>>>>>>> devoidfury/async_templates
        });
    });
})();
