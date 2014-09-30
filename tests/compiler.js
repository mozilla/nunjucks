(function() {
    var expect, util, Environment, Template, fs;

    if(typeof require != 'undefined') {
        expect = require('expect.js');
        util = require('./util');
        Environment = require('../src/environment').Environment;
        Template = require('../src/environment').Template;
        fs = require('fs');
    }
    else {
        expect = window.expect;
        util = window.util;
        Environment = nunjucks.Environment;
        Template = nunjucks.Template;
    }

    var render = util.render;
    var equal = util.equal;
    var finish = util.finish;

    describe('compiler', function() {
        it('should compile templates', function(done) {
            equal('Hello world', 'Hello world');
            equal('Hello world, {{ name }}',
                  { name: 'James' },
                  'Hello world, James');

            equal('Hello world, {{name}}{{suffix}}, how are you',
                  { name: 'James',
                    suffix: ' Long'},
                  'Hello world, James Long, how are you');

            finish(done);
        });

        it('should escape newlines', function(done) {
            equal('foo\\nbar', 'foo\\nbar');
            finish(done);
        });

        it('should compile references', function(done) {
            equal('{{ foo.bar }}',
                  { foo: { bar: 'baz' }},
                  'baz');

            equal('{{ foo["bar"] }}',
                  { foo: { bar: 'baz' }},
                  'baz');

            finish(done);
        });

        it('should fail silently on undefined values', function(done) {
            equal('{{ foo }}', '');
            equal('{{ foo.bar }}', '');
            equal('{{ foo.bar.baz }}', '');
            equal('{{ foo.bar.baz["biz"].mumble }}', '');
            finish(done);
        });

        it('should not treat falsy values the same as undefined', function(done) {
            equal('{{ foo }}', {foo: 0}, '0');
            equal('{{ foo }}', {foo: false}, 'false');
            finish(done);
        });

        it('should compile function calls', function(done) {
            equal('{{ foo("msg") }}',
                  { foo: function(str) { return str + 'hi'; }},
                  'msghi');
            finish(done);
        });

        it('should compile function calls with correct scope', function(done) {
            equal('{{ foo.bar() }}', {
                foo: {
                    bar: function() { return this.baz; },
                    baz: 'hello'
                }
            }, 'hello');

            finish(done);
        });

        it('should compile if blocks', function(done) {
            var tmpl = ('Give me some {% if hungry %}pizza' +
                        '{% else %}water{% endif %}');

            equal(tmpl, { hungry: true }, 'Give me some pizza');
            equal(tmpl, { hungry: false }, 'Give me some water');
            equal('{% if not hungry %}good{% endif %}',
                  { hungry: false },
                  'good');

            equal('{% if hungry and like_pizza %}good{% endif %}',
                  { hungry: true, like_pizza: true },
                  'good');

            equal('{% if hungry or like_pizza %}good{% endif %}',
                  { hungry: false, like_pizza: true },
                  'good');

            equal('{% if (hungry or like_pizza) and anchovies %}good{% endif %}',
                  { hungry: false, like_pizza: true, anchovies: true },
                  'good');

            equal('{% if food == "pizza" %}pizza{% endif %}' +
                  '{% if food =="beer" %}beer{% endif %}',
                  { food: 'beer' },
                  'beer');

            finish(done);
        });

        it('should compile the ternary operator', function(done) {
            equal('{{ "foo" if bar else "baz" }}', 'baz');
            equal('{{ "foo" if bar else "baz" }}', { bar: true }, 'foo');

            finish(done);
        });

        it('should compile inline conditionals', function(done) {
            var tmpl = 'Give me some {{ "pizza" if hungry else "water" }}';

            equal(tmpl, { hungry: true }, 'Give me some pizza');
            equal(tmpl, { hungry: false }, 'Give me some water');
            equal('{{ "good" if not hungry }}',
                  { hungry: false }, 'good');
            equal('{{ "good" if hungry and like_pizza }}',
                  { hungry: true, like_pizza: true }, 'good');
            equal('{{ "good" if hungry or like_pizza }}',
                  { hungry: false, like_pizza: true }, 'good');
            equal('{{ "good" if (hungry or like_pizza) and anchovies }}',
                  { hungry: false, like_pizza: true, anchovies: true }, 'good');
            equal('{{ "pizza" if food == "pizza" }}' +
                  '{{ "beer" if food == "beer" }}',
                  { food: 'beer' }, 'beer');

            finish(done);
        });

        function runLoopTests(block, end) {
            equal('{% ' + block + ' i in arr %}{{ i }}{% ' + end + ' %}',
                  { arr: [1, 2, 3, 4, 5] }, '12345');

            equal('{% ' + block + ' i in arr %}{{ i }}{% else %}empty{% ' + end + ' %}',
                  { arr: [1, 2, 3, 4, 5] }, '12345');

            equal('{% ' + block + ' i in arr %}{{ i }}{% else %}empty{% ' + end + ' %}',
                  { arr: [] }, 'empty');

            equal('{% ' + block + ' a, b, c in arr %}' +
                       '{{ a }},{{ b }},{{ c }}.{% ' + end + ' %}',
                  { arr: [['x', 'y', 'z'], ['1', '2', '3']] }, 'x,y,z.1,2,3.');

            equal('{% ' + block + ' item in arr | batch(2) %}{{ item[0] }}{% ' + end + ' %}',
                  { arr: ['a', 'b', 'c', 'd'] }, 'ac');

            equal('{% ' + block + ' k, v in { one: 1, two: 2 } %}' +
                  '-{{ k }}:{{ v }}-{% ' + end + ' %}', '-one:1--two:2-');

            equal('{% ' + block + ' i in [7,3,6] %}{{ loop.index }}{% ' + end + ' %}', '123');
            equal('{% ' + block + ' i in [7,3,6] %}{{ loop.index0 }}{% ' + end + ' %}', '012');
            equal('{% ' + block + ' i in [7,3,6] %}{{ loop.revindex }}{% ' + end + ' %}', '321');
            equal('{% ' + block + ' i in [7,3,6] %}{{ loop.revindex0 }}{% ' + end + ' %}', '210');
            equal('{% ' + block + ' i in [7,3,6] %}{% if loop.first %}{{ i }}{% endif %}{% ' + end + ' %}',
                  '7');
            equal('{% ' + block + ' i in [7,3,6] %}{% if loop.last %}{{ i }}{% endif %}{% ' + end + ' %}',
                  '6');
            equal('{% ' + block + ' i in [7,3,6] %}{{ loop.length }}{% ' + end + ' %}', '333');
            equal('{% ' + block + ' i in foo %}{{ i }}{% ' + end + ' %}', '');
            equal('{% ' + block + ' i in foo.bar %}{{ i }}{% ' + end + ' %}', { foo: {} }, '');
            equal('{% ' + block + ' i in foo %}{{ i }}{% ' + end + ' %}', { foo: null }, '');

            equal('{% ' + block + ' x, y in points %}[{{ x }},{{ y }}]{% ' + end + ' %}',
                  { points: [[1,2], [3,4], [5,6]] },
                  '[1,2][3,4][5,6]');

            equal('{% ' + block + ' x, y in points %}{{ loop.index }}{% ' + end + ' %}',
                  { points: [[1,2], [3,4], [5,6]] },
                  '123');

            equal('{% ' + block + ' x, y in points %}{{ loop.revindex }}{% ' + end + ' %}',
                  { points: [[1,2], [3,4], [5,6]] },
                  '321');

            equal('{% ' + block + ' k, v in items %}({{ k }},{{ v }}){% ' + end + ' %}',
                  { items: { foo: 1, bar: 2 }},
                  '(foo,1)(bar,2)');

            equal('{% ' + block + ' k, v in items %}{{ loop.index }}{% ' + end + ' %}',
                  { items: { foo: 1, bar: 2 }},
                  '12');

            equal('{% ' + block + ' k, v in items %}{{ loop.revindex }}{% ' + end + ' %}',
                  { items: { foo: 1, bar: 2 }},
                  '21');

            equal('{% ' + block + ' k, v in items %}{{ loop.length }}{% ' + end + ' %}',
                  { items: { foo: 1, bar: 2 }},
                  '22');

            equal('{% ' + block + ' item, v in items %}{% include "item.html" %}{% ' + end + ' %}',
                  { items: { foo: 1, bar: 2 }},
                  'showing fooshowing bar');

            render('{% set item = passed_var %}' +
                   '{% include "item.html" %}\n' +
                   '{% ' + block + ' i in passed_iter %}' +
                     '{% set item = i %}' +
                     '{% include "item.html" %}\n' +
                   '{% ' + end + ' %}',
                   {
                     passed_var: 'test',
                     passed_iter: ['1', '2', '3']
                   },
                   {},
                   function(err, res) {
                       expect(res).to.be('showing test\nshowing 1\nshowing 2\nshowing 3\n');
                   });
        }

        it('should compile for blocks', function(done) {
            runLoopTests('for', 'endfor');
            finish(done);
        });

        it('should compile asyncEach', function(done) {
            runLoopTests('asyncEach', 'endeach');
            finish(done);
        });

        it('should compile asyncAll', function(done) {
            runLoopTests('asyncAll', 'endall');
            finish(done);
        });

        it('should compile async control', function(done) {
            if(fs) {
                var opts = {
                    asyncFilters: {
                        getContents: function(tmpl, cb) {
                            fs.readFile(tmpl, cb);
                        },

                        getContentsArr: function(arr, cb) {
                            fs.readFile(arr[0], function(err, res) {
                                cb(err, [res]);
                            });
                        }
                    }
                };

                render('{{ tmpl | getContents }}',
                       { tmpl: 'tests/templates/for-async-content.html' },
                       opts,
                       function(err, res) {
                           expect(res).to.be('somecontenthere');
                       });

                render('{% if tmpl %}{{ tmpl | getContents }}{% endif %}',
                       { tmpl: 'tests/templates/for-async-content.html' },
                       opts,
                       function(err, res) {
                           expect(res).to.be('somecontenthere');
                       });

                render('{% if tmpl | getContents %}yes{% endif %}',
                       { tmpl: 'tests/templates/for-async-content.html' },
                       opts,
                       function(err, res) {
                           expect(res).to.be('yes');
                       });

                render('{% for t in [tmpl, tmpl] %}{{ t | getContents }}*{% endfor %}',
                       { tmpl: 'tests/templates/for-async-content.html' },
                       opts,
                       function(err, res) {
                           expect(res).to.be('somecontenthere*somecontenthere*');
                       });

                render('{% for t in [tmpl, tmpl] | getContentsArr %}{{ t }}{% endfor %}',
                       { tmpl: 'tests/templates/for-async-content.html' },
                       opts,
                       function(err, res) {
                           expect(res).to.be('somecontenthere');
                       });

                render('{% if test %}{{ tmpl | getContents }}{% endif %}oof',
                       { tmpl: 'tests/templates/for-async-content.html' },
                       opts,
                       function(err, res) {
                           expect(res).to.be('oof');
                       });

                render('{% if tmpl %}' +
                       '{% for i in [0, 1] %}{{ tmpl | getContents }}*{% endfor %}' +
                       '{% endif %}',
                       { tmpl: 'tests/templates/for-async-content.html' },
                       opts,
                       function(err, res) {
                           expect(res).to.be('somecontenthere*somecontenthere*');
                       });

                render('{% block content %}{{ tmpl | getContents }}{% endblock %}',
                       { tmpl: 'tests/templates/for-async-content.html' },
                       opts,
                       function(err, res) {
                           expect(res).to.be('somecontenthere');
                       });

                render('{% block content %}hello{% endblock %} {{ tmpl | getContents }}',
                       { tmpl: 'tests/templates/for-async-content.html' },
                       opts,
                       function(err, res) {
                           expect(res).to.be('hello somecontenthere');
                       });

                render('{% block content %}{% include "async.html" %}{% endblock %}',
                       { tmpl: 'tests/templates/for-async-content.html' },
                       opts,
                       function(err, res) {
                           expect(res).to.be('somecontenthere\n');
                       });

                render('{% asyncEach i in [0, 1] %}{% include "async.html" %}{% endeach %}',
                       { tmpl: 'tests/templates/for-async-content.html' },
                       opts,
                       function(err, res) {
                           expect(res).to.be('somecontenthere\nsomecontenthere\n');
                       });

                render('{% asyncAll i in [0, 1, 2, 3, 4] %}-{{ i }}:{% include "async.html" %}-{% endall %}',
                       { tmpl: 'tests/templates/for-async-content.html' },
                       opts,
                       function(err, res) {
                           expect(res).to.be('-0:somecontenthere\n-' +
                                             '-1:somecontenthere\n-' +
                                             '-2:somecontenthere\n-' +
                                             '-3:somecontenthere\n-' +
                                             '-4:somecontenthere\n-');
                       });
            }

            finish(done);
        });

        it('should compile operators', function(done) {
            equal('{{ 3 + 4 - 5 * 6 / 10 }}', '4');
            equal('{{ 4**5 }}', '1024');
            equal('{{ 9//5 }}', '1');
            equal('{{ 9%5 }}', '4');
            equal('{{ -5 }}', '-5');

            equal('{% if 3 < 4 %}yes{% endif %}', 'yes');
            equal('{% if 3 > 4 %}yes{% endif %}', '');
            equal('{% if 9 >= 10 %}yes{% endif %}', '');
            equal('{% if 10 >= 10 %}yes{% endif %}', 'yes');
            equal('{% if 9 <= 10 %}yes{% endif %}', 'yes');
            equal('{% if 10 <= 10 %}yes{% endif %}', 'yes');
            equal('{% if 11 <= 10 %}yes{% endif %}', '');

            equal('{% if 10 != 10 %}yes{% endif %}', '');
            equal('{% if 10 == 10 %}yes{% endif %}', 'yes');

            equal('{% if foo(20) > bar %}yes{% endif %}',
                  { foo: function(n) { return n - 1; },
                    bar: 15 },
                  'yes');

            equal('{% if 1 in [1, 2] %}yes{% endif %}', 'yes');
            equal('{% if 1 in [2, 3] %}yes{% endif %}', '');
            equal('{% if 1 not in [1, 2] %}yes{% endif %}', '');
            equal('{% if 1 not in [2, 3] %}yes{% endif %}', 'yes');
            equal('{% if "a" in vals %}yes{% endif %}',
                  {'vals': ['a', 'b']}, 'yes');

            finish(done);
        });

        it('should compile macros', function(done) {
            equal('{% macro foo() %}This is a macro{% endmacro %}' +
                  '{{ foo() }}',
                  'This is a macro');

            equal('{% macro foo(x, y) %}{{ y }}{% endmacro %}' +
                  '{{ foo(1) }}',
                  '');

            equal('{% macro foo(x) %}{{ x|title }}{% endmacro %}' +
                  '{{ foo("foo") }}',
                  'Foo');

            equal('{% macro foo(x, y) %}{{ y }}{% endmacro %}' +
                  '{{ foo(1, 2) }}',
                  '2');

            equal('{% macro foo(x, y, z=5) %}{{ y }}{% endmacro %}' +
                  '{{ foo(1, 2) }}',
                  '2');

            equal('{% macro foo(x, y, z=5) %}{{ z }}{% endmacro %}' +
                  '{{ foo(1, 2) }}',
                  '5');

            equal('{% macro foo(x, y, z=5) %}{{ y }}{% endmacro %}' +
                  '{{ foo(1, y=2) }}',
                  '2');

            equal('{% macro foo(x, y, z=5) %}{{ x }}{{ y }}{{ z }}' +
                  '{% endmacro %}' +
                  '{{ foo(x=1, y=2) }}',
                  '125');

            equal('{% macro foo(x, y, z=5) %}{{ x }}{{ y }}{{ z }}' +
                  '{% endmacro %}' +
                  '{{ foo(x=1, y=2, z=3) }}',
                  '123');

            equal('{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                  '{% endmacro %}' +
                  '{{ foo(1, z=3) }}',
                  '123');

            equal('{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                  '{% endmacro %}' +
                  '{{ foo(1) }}',
                  '125');

            equal('{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                  '{% endmacro %}' +
                  '{{ foo(1, 10, 20) }}',
                  '11020');

            equal('{% extends "base.html" %}' +
                  '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                  '{% endmacro %}' +
                  '{% block block1 %}' +
                  '{{ foo(1) }}' +
                  '{% endblock %}',
                  'Foo125BazFizzle');

            equal('{% block bar %}' +
                  '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                  '{% endmacro %}' +
                  '{% endblock %}' +
                  '{% block baz %}' +
                  '{{ foo(1) }}' +
                  '{% endblock %}',
                  '125');

            equal('{% macro foo() %}{% include "include.html" %}{% endmacro %}' +
                  '{{ foo() }}',
                  { name: 'james' },
                  'FooInclude james');

            finish(done);
        });

        it('should compile call blocks', function(done) {
          equal('{% macro wrap(el) %}' +
                '<{{ el }}>{{ caller() }}</{{ el }}>' +
                '{% endmacro %}' +
                '{% call wrap("div") %}Hello{% endcall %}',
                '<div>Hello</div>');

          finish(done);
        });

        it('should compile call blocks with args', function(done) {
          equal('{% macro list(items) %}' +
                '<ul>{% for i in items %}' +
                '<li>{{ caller(i) }}</li>' +
                '{% endfor %}</ul>' +
                '{% endmacro %}' +
                '{% call(item) list(["a", "b"]) %}{{ item }}{% endcall %}',
                '<ul><li>a</li><li>b</li></ul>');

          finish(done);
        });

        it('should compile call blocks using imported macros', function(done) {
          equal('{% import "import.html" as imp %}' +
                '{% call imp.wrap("span") %}Hey{% endcall %}',
                '<span>Hey</span>');
          finish(done);
        });

        it('should import templates', function(done) {
            equal('{% import "import.html" as imp %}' +
                  '{{ imp.foo() }} {{ imp.bar }}',
                  "Here's a macro baz");

            equal('{% from "import.html" import foo as baz, bar %}' +
                  '{{ bar }} {{ baz() }}',
                  "baz Here's a macro");

            // TODO: Should the for loop create a new frame for each
            // iteration? As it is, `num` is set on all iterations after
            // the first one sets it
            equal('{% for i in [1,2] %}' +
                  'start: {{ num }}' +
                  '{% from "import.html" import bar as num %}' +
                  'end: {{ num }}' +
                  '{% endfor %}' +
                  'final: {{ num }}',
                  'start: end: bazstart: bazend: bazfinal: ');

            finish(done);
        });

        it('should inherit templates', function(done) {
            equal('{% extends "base.html" %}', 'FooBarBazFizzle');
            equal('hola {% extends "base.html" %} hizzle mumble', 'FooBarBazFizzle');

            equal('{% extends "base.html" %}{% block block1 %}BAR{% endblock %}',
                  'FooBARBazFizzle');

            equal('{% extends "base.html" %}' +
                  '{% block block1 %}BAR{% endblock %}' +
                  '{% block block2 %}BAZ{% endblock %}',
                  'FooBARBAZFizzle');

            equal('hola {% extends tmpl %} hizzle mumble',
                  { tmpl: 'base.html' },
                  'FooBarBazFizzle');

            var count = 0;
            render('{% extends "base.html" %}' +
                   '{% block notReal %}{{ foo() }}{% endblock %}',
                   { foo: function() { count++; }},
                   function(err, res) {
                       expect(count).to.be(0);
                   });

            finish(done);
        });

        it('should render nested blocks in child template', function(done) {
            equal('{% extends "base.html" %}' +
                  '{% block block1 %}{% block nested %}BAR{% endblock %}{% endblock %}',
                  'FooBARBazFizzle');

            finish(done);
        });

        it('should render parent blocks with super()', function(done) {
            equal('{% extends "base.html" %}' +
                  '{% block block1 %}{{ super() }}BAR{% endblock %}',
                  'FooBarBARBazFizzle');

            // two levels of `super` should work
            equal('{% extends "base-inherit.html" %}' +
                  '{% block block1 %}*{{ super() }}*{% endblock %}',
                  'Foo**Bar**BazFizzle');

            finish(done);
        });

        it('should include templates', function(done) {
            equal('hello world {% include "include.html" %}',
                  'hello world FooInclude ');

            equal('hello world {% include "include.html" %}',
                  { name: 'james' },
                  'hello world FooInclude james');

            equal('hello world {% include tmpl %}',
                  { name: 'thedude', tmpl: "include.html" },
                  'hello world FooInclude thedude');

            equal('hello world {% include data.tmpl %}',
                  { name: 'thedude', data: {tmpl: "include.html"} },
                  'hello world FooInclude thedude');

            finish(done);
        });

        /**
         * This test checks that this issue is resolved: http://stackoverflow.com/questions/21777058/loop-index-in-included-nunjucks-file
         */
        it('should have access to "loop" inside an include', function(done) {
            equal('{% for item in [1,2,3] %}{% include "include-in-loop.html" %}{% endfor %}',
                  '1,0,true\n2,1,false\n3,2,false\n');

            equal('{% for k,v in items %}{% include "include-in-loop.html" %}{% endfor %}',
                {items: {'a': 'A', 'b': 'B'}},
                '1,0,true\n2,1,false\n');

            finish(done);
        });

        it('should maintain nested scopes', function(done) {
            equal('{% for i in [1,2] %}' +
                  '{% for i in [3,4] %}{{ i }}{% endfor %}' +
                  '{{ i }}{% endfor %}',
                  '341342');

            finish(done);
        });

        it('should allow blocks in for loops', function(done) {
            equal('{% extends "base2.html" %}' +
                  '{% block item %}hello{{ item }}{% endblock %}',
                  'hello1hello2');

            finish(done);
        });

        it('should make includes inherit scope', function(done) {
            equal('{% for item in [1,2] %}' +
                  '{% include "item.html" %}' +
                  '{% endfor %}',
                  'showing 1showing 2');

            finish(done);
        });

        it('should compile a set block', function(done) {
            equal('{% set username = "foo" %}{{ username }}',
                  { username: 'james' },
                  'foo');

            equal('{% set x, y = "foo" %}{{ x }}{{ y }}',
                  'foofoo');

            equal('{% set x = 1 + 2 %}{{ x }}',
                  '3');

            equal('{% for i in [1] %}{% set foo=1 %}{% endfor %}{{ foo }}',
                  { foo: 2 },
                  '2');

            equal('{% include "set.html" %}{{ foo }}',
                  { foo: 'bar' },
                  'bar');

            equal('{% set username = username + "pasta" %}{{ username }}',
                  { username: 'basta' },
                  'bastapasta');

            // `set` should only set within its current scope
            equal('{% for i in [1] %}{% set val=5 %}{% endfor %}' +
                  '{{ val }}',
                  '');

            equal('{% for i in [1,2,3] %}' +
                  '{% if not val %}{% set val=5 %}{% endif %}' +
                  '{% set val=val+1 %}{{ val }}' +
                  '{% endfor %}' +
                  'afterwards: {{ val }}',
                  '678afterwards: ');

            // however, like Python, if a variable has been set in an
            // above scope, any other set should correctly resolve to
            // that frame
            equal('{% set val=1 %}' +
                  '{% for i in [1] %}{% set val=5 %}{% endfor %}' +
                  '{{ val }}',
                  '5');

            equal('{% set val=5 %}' +
                  '{% for i in [1,2,3] %}' +
                  '{% set val=val+1 %}{{ val }}' +
                  '{% endfor %}' +
                  'afterwards: {{ val }}',
                  '678afterwards: 8');

            finish(done);
        });

        it('should compile set with frame references', function(done) {
            equal('{% set username = user.name %}{{ username }}',
                  { user: { name: 'james' } },
                  'james');

            finish(done);
        });

        it('should compile set assignments of the same variable', function(done) {
            equal('{% set x = "hello" %}' +
                  '{% if false %}{% set x = "world" %}{% endif %}' +
                  '{{ x }}',
                  'hello');

            equal('{% set x = "blue" %}' +
                  '{% if true %}{% set x = "green" %}{% endif %}' +
                  '{{ x }}',
                  'green');

            finish(done);
        });

        it('should throw errors', function(done) {
            render('{% from "import.html" import boozle %}',
                   {},
                   { noThrow: true },
                   function(err) {
                       expect(err).to.match(/cannot import 'boozle'/);
                   });

            finish(done);
        });

        it('should allow custom tag compilation', function(done) {
            function testExtension() {
                this.tags = ['test'];

                this.parse = function(parser, nodes) {
                    parser.advanceAfterBlockEnd();

                    var content = parser.parseUntilBlocks("endtest");
                    var tag = new nodes.CallExtension(this, 'run', null, [content]);
                    parser.advanceAfterBlockEnd();

                    return tag;
                };

                this.run = function(context, content) {
                    // Reverse the string
                    return content().split("").reverse().join("");
                };
            }

            var opts = { extensions: { 'testExtension': new testExtension() }};
            render('{% test %}123456789{% endtest %}', null, opts, function(err, res) {
                expect(res).to.be('987654321');
            });

            finish(done);
        });

        it('should allow custom tag compilation without content', function(done) {
            function testExtension() {
                this.tags = ['test'];

                this.parse = function(parser, nodes) {
                    var tok = parser.nextToken();
                    var args = parser.parseSignature(null, true);
                    parser.advanceAfterBlockEnd(tok.value);

                    return new nodes.CallExtension(this, 'run', args, null);
                };

                this.run = function(context, arg1) {
                    // Reverse the string
                    return arg1.split("").reverse().join("");
                };
            }

            var opts = { extensions: { 'testExtension': new testExtension() }};
            render('{% test "123456" %}', null, opts, function(err, res) {
                expect(res).to.be('654321');
            });

            finish(done);
        });

        it('should allow complicated custom tag compilation', function(done) {
            function testExtension() {
                this.tags = ['test'];

                /* normally this is automatically done by Environment */
                this._name = 'testExtension';

                this.parse = function(parser, nodes, lexer) {
                    var body, intermediate = null;
                    parser.advanceAfterBlockEnd();

                    body = parser.parseUntilBlocks('intermediate', 'endtest');

                    if(parser.skipSymbol('intermediate')) {
                        parser.skip(lexer.TOKEN_BLOCK_END);
                        intermediate = parser.parseUntilBlocks('endtest');
                    }

                    parser.advanceAfterBlockEnd();

                    return new nodes.CallExtension(this, 'run', null, [body, intermediate]);
                };

                this.run = function(context, body, intermediate) {
                    var output = body().split("").join(",");
                    if(intermediate) {
                        // Reverse the string.
                        output += intermediate().split("").reverse().join("");
                    }
                    return output;
                };
            }

            var opts = { extensions: { 'testExtension': new testExtension() }};

            render('{% test %}abcdefg{% endtest %}', null, opts, function(err, res) {
                expect(res).to.be('a,b,c,d,e,f,g');
            });

            render('{% test %}abcdefg{% intermediate %}second half{% endtest %}',
                   null,
                   opts,
                   function(err, res) {
                       expect(res).to.be('a,b,c,d,e,f,gflah dnoces');
                   });

            finish(done);
        });

        it('should allow custom tag with args compilation', function(done) {
            function testExtension() {
                this.tags = ['test'];

                /* normally this is automatically done by Environment */
                this._name = 'testExtension';

                this.parse = function(parser, nodes, lexer) {
                    var body, args = null;
                    var tok = parser.nextToken();

                    // passing true makes it tolerate when no args exist
                    args = parser.parseSignature(true);
                    parser.advanceAfterBlockEnd(tok.value);

                    body = parser.parseUntilBlocks('endtest');
                    parser.advanceAfterBlockEnd();

                    return new nodes.CallExtension(this, 'run', args, [body]);
                };

                this.run = function(context, prefix, kwargs, body) {
                    if(typeof prefix == 'function') {
                        body = prefix;
                        prefix = '';
                        kwargs = {};
                    }
                    else if(typeof kwargs == 'function') {
                        body = kwargs;
                        kwargs = {};
                    }

                    var output = prefix + body().split('').reverse().join('');
                    if(kwargs.cutoff) {
                        output = output.slice(0, kwargs.cutoff);
                    }

                    return output;
                };
            }

            var opts = { extensions: {'testExtension': new testExtension() }};

            render('{% test %}foobar{% endtest %}', null, opts, function(err, res) {
                expect(res).to.be('raboof');
            });

            render('{% test("biz") %}foobar{% endtest %}', null, opts, function(err, res) {
                expect(res).to.be('bizraboof');
            });

            render('{% test("biz", cutoff=5) %}foobar{% endtest %}', null, opts, function(err, res) {
                expect(res).to.be('bizra');
            });

            finish(done);
        });

        it('should not autoescape by default', function(done) {
            equal('{{ foo }}', { foo: '"\'<>&'}, '"\'<>&');
            finish(done);
        });

        it('should autoescape if autoescape is on', function(done) {
            render('{{ foo }}', { foo: '"\'<>&'}, { autoescape: true }, function(err, res) {
                expect(res).to.be('&quot;&#39;&lt;&gt;&amp;');
            });

            render('{{ foo|reverse }}', { foo: '"\'<>&'}, { autoescape: true }, function(err, res) {
                expect(res).to.be('&amp;&gt;&lt;&#39;&quot;');
            });

            render('{{ foo|reverse|safe }}', { foo: '"\'<>&'}, { autoescape: true }, function(err, res) {
                expect(res).to.be('&><\'"');
            });

            finish(done);
        });

        it('should not autoescape safe strings', function(done) {
            render('{{ foo|safe }}', { foo: '"\'<>&'}, { autoescape: true }, function(err, res) {
                expect(res).to.be('"\'<>&');
            });

            finish(done);
        });

        it('should not autoescape macros', function(done) {
            render(
                '{% macro foo(x, y) %}{{ x }} and {{ y }}{% endmacro %}' +
                    '{{ foo("<>&", "<>") }}',
                null,
                { autoescape: true },
                function(err, res) {
                    expect(res).to.be('&lt;&gt;&amp; and &lt;&gt;');
                }
            );

            render(
                '{% macro foo(x, y) %}{{ x|safe }} and {{ y }}{% endmacro %}' +
                    '{{ foo("<>&", "<>") }}',
                null,
                { autoescape: true },
                function(err, res) {
                    expect(res).to.be('<>& and &lt;&gt;');
                }
            );

            finish(done);
        });

        it('should not autoescape super()', function(done) {
            render(
                '{% extends "base3.html" %}' +
                    '{% block block1 %}{{ super() }}{% endblock %}',
                null,
                { autoescape: true },
                function(err, res) {
                    expect(res).to.be('<b>Foo</b>');
                }
            );

            finish(done);
        });

        it('should not autoescape when extension set false', function(done) {
            function testExtension() {
                this.tags = ['test'];

                this.autoescape = false;

                this.parse = function(parser, nodes) {
                    var tok = parser.nextToken();
                    var args = parser.parseSignature(null, true);
                    parser.advanceAfterBlockEnd(tok.value);
                    return new nodes.CallExtension(this, 'run', args, null);
                };

                this.run = function(context) {
                    // Reverse the string
                    return '<b>Foo</b>';
                };
            }

            var opts = {
                extensions: { 'testExtension': new testExtension() },
                autoescape: true
            };

            render(
                '{% test "123456" %}',
                null,
                opts,
                function(err, res) {
                    expect(res).to.be('<b>Foo</b>');
                }
            );

            finish(done);
        });

        it('should pass context as this to filters', function(done) {
            render(
                '{{ foo | hallo }}',
                { foo: 1, bar: 2 },
                { filters: {
                    'hallo': function(foo) { return foo + this.lookup('bar'); }
                }},
                function(err, res) {
                    expect(res).to.be('3');
                }
            );

            finish(done);
        });

        it('should render regexs', function(done) {
            equal('{{ r/name [0-9] \\// }}',
                  '/name [0-9] \\//');

            equal('{{ r/x/gi }}',
                  '/x/gi');

            finish(done);
        });
    });
})();
