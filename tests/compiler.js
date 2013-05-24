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

    describe('compiler', function() {
        it('should compile templates', function() {
            var s = render('Hello world');
            expect(s).to.equal('Hello world');

            s = render('Hello world, {{ name }}',
                       { name: 'James' });
            expect(s).to.equal('Hello world, James');

            s = render('Hello world, {{name}}{{suffix}}, how are you',
                       { name: 'James',
                         suffix: ' Long'});
            expect(s).to.equal('Hello world, James Long, how are you');
        });

        it('should escape newlines', function() {
            expect(render('foo\\nbar')).to.be('foo\\nbar');
        });

        it('should compile references', function() {
            var s = render('{{ foo.bar }}',
                           { foo: { bar: 'baz' }});
            expect(s).to.be('baz');

            s = render('{{ foo["bar"] }}',
                       { foo: { bar: 'baz' }});
            expect(s).to.be('baz');
        });

        it('should fail silently on undefined values', function() {
            var s = render('{{ foo }}');
            expect(s).to.be('');

            s = render('{{ foo.bar }}');
            expect(s).to.be('');

            s = render('{{ foo.bar.baz }}');
            expect(s).to.be('');

            s = render('{{ foo.bar.baz["biz"].mumble }}');
            expect(s).to.be('');
        });

        it('should not treat falsy values the same as undefined', function() {
            var s = render('{{ foo }}', {foo: 0});
            expect(s).to.be('0');

            s = render('{{ foo }}', {foo: false});
            expect(s).to.be('false');
        });

        it('should compile function calls', function() {
            var s = render('{{ foo("msg") }}',
                           { foo: function(str) { return str + 'hi'; }});
            expect(s).to.be('msghi');
        });

        it('should compile function calls with correct scope', function() {
            var s = render('{{ foo.bar() }}', {
                foo: { 
                    bar: function() { return this.baz; },
                    baz: 'hello'
                }
            });

            expect(s).to.be('hello');
        });

        it('should compile if blocks', function() {
            var tmpl = ('Give me some {% if hungry %}pizza' +
                        '{% else %}water{% endif %}');

            var s = render(tmpl, { hungry: true });
            expect(s).to.be('Give me some pizza');

            s = render(tmpl, { hungry: false });
            expect(s).to.be('Give me some water');

            s = render('{% if not hungry %}good{% endif %}',
                       { hungry: false });
            expect(s).to.be('good');

            s = render('{% if hungry and like_pizza %}good{% endif %}',
                       { hungry: true, like_pizza: true });
            expect(s).to.be('good');

            s = render('{% if hungry or like_pizza %}good{% endif %}',
                       { hungry: false, like_pizza: true });
            expect(s).to.be('good');

            s = render('{% if (hungry or like_pizza) and anchovies %}good{% endif %}',
                       { hungry: false, like_pizza: true, anchovies: true });
            expect(s).to.be('good');

            s = render('{% if food == "pizza" %}pizza{% endif %}' +
                       '{% if food =="beer" %}beer{% endif %}',
                       { food: 'beer' });
            expect(s).to.be('beer');
        });

        it('should compile the ternary operator', function() {
            var s = render('{{ "foo" if bar else "baz" }}');
            expect(s).to.be('baz');

            var s = render('{{ "foo" if bar else "baz" }}', { bar: true });
            expect(s).to.be('foo');
        });

        it('should compile inline conditionals', function() {
            var tmpl = 'Give me some {{ "pizza" if hungry else "water" }}';

            var s = render(tmpl, { hungry: true });
            expect(s).to.be('Give me some pizza');

            s = render(tmpl, { hungry: false });
            expect(s).to.be('Give me some water');

            s = render('{{ "good" if not hungry }}',
                       { hungry: false });
            expect(s).to.be('good');

            s = render('{{ "good" if hungry and like_pizza }}',
                       { hungry: true, like_pizza: true });
            expect(s).to.be('good');

            s = render('{{ "good" if hungry or like_pizza }}',
                       { hungry: false, like_pizza: true });
            expect(s).to.be('good');

            s = render('{{ "good" if (hungry or like_pizza) and anchovies }}',
                       { hungry: false, like_pizza: true, anchovies: true });
            expect(s).to.be('good');

            s = render('{{ "pizza" if food == "pizza" }}' +
                       '{{ "beer" if food == "beer" }}',
                       { food: 'beer' });
            expect(s).to.be('beer');
        });

        it('should compile for blocks', function() {
            var s = render('{% for i in arr %}{{ i }}{% endfor %}',
                           { arr: [1, 2, 3, 4, 5] });
            expect(s).to.be('12345');

            s = render('{% for a, b, c in arr %}' +
                       '{{ a }},{{ b }},{{ c }}.{% endfor %}',
                       { arr: [['x', 'y', 'z'], ['1', '2', '3']] });
            expect(s).to.be('x,y,z.1,2,3.');

            s = render('{% for item in arr | batch(2) %}{{ item[0] }}{% endfor %}',
                       { arr: ['a', 'b', 'c', 'd'] });
            expect(s).to.be('ac');

            s = render('{% for k, v in { one: 1, two: 2 } %}' +
                       '-{{ k }}:{{ v }}-{% endfor %}');
            expect(s).to.be('-one:1--two:2-');

            s = render('{% for i in [7,3,6] %}{{ loop.index }}{% endfor %}');
            expect(s).to.be('123');

            s = render('{% for i in [7,3,6] %}{{ loop.index0 }}{% endfor %}');
            expect(s).to.be('012');

            s = render('{% for i in [7,3,6] %}{{ loop.revindex }}{% endfor %}');
            expect(s).to.be('321');

            s = render('{% for i in [7,3,6] %}{{ loop.revindex0 }}{% endfor %}');
            expect(s).to.be('210');

            s = render('{% for i in [7,3,6] %}{% if loop.first %}{{ i }}{% endif %}{% endfor %}');
            expect(s).to.be('7');

            s = render('{% for i in [7,3,6] %}{% if loop.last %}{{ i }}{% endif %}{% endfor %}');
            expect(s).to.be('6');

            s = render('{% for i in [7,3,6] %}{{ loop.length }}{% endfor %}');
            expect(s).to.be('333');

            s = render('{% for i in foo %}{{ i }}{% endfor %}');
            expect(s).to.be('');

            s = render('{% for i in foo.bar %}{{ i }}{% endfor %}', { foo: {} });
            expect(s).to.be('');
        });

        it('should compile operators', function() {
            expect(render('{{ 3 + 4 - 5 * 6 / 10 }}')).to.be('4');
            expect(render('{{ 4**5 }}')).to.be('1024');
            expect(render('{{ 9//5 }}')).to.be('1');
            expect(render('{{ 9%5 }}')).to.be('4');
            expect(render('{{ -5 }}')).to.be('-5');

            expect(render('{% if 3 < 4 %}yes{% endif %}')).to.be('yes');
            expect(render('{% if 3 > 4 %}yes{% endif %}')).to.be('');
            expect(render('{% if 9 >= 10 %}yes{% endif %}')).to.be('');
            expect(render('{% if 10 >= 10 %}yes{% endif %}')).to.be('yes');
            expect(render('{% if 9 <= 10 %}yes{% endif %}')).to.be('yes');
            expect(render('{% if 10 <= 10 %}yes{% endif %}')).to.be('yes');
            expect(render('{% if 11 <= 10 %}yes{% endif %}')).to.be('');

            expect(render('{% if 10 != 10 %}yes{% endif %}')).to.be('');
            expect(render('{% if 10 == 10 %}yes{% endif %}')).to.be('yes');

            var s = render('{% if foo(20) > bar %}yes{% endif %}',
                           { foo: function(n) { return n - 1; },
                             bar: 15 });
            expect(s).to.be('yes');
        });

        it('should compile macros', function() {
            var s = render('{% macro foo() %}This is a macro{% endmacro %}' +
                           '{{ foo() }}');
            expect(s).to.be('This is a macro');

            s = render('{% macro foo(x, y) %}{{ y }}{% endmacro %}' +
                       '{{ foo(1) }}');
            expect(s).to.be('');

            s = render('{% macro foo(x, y) %}{{ y }}{% endmacro %}' +
                       '{{ foo(1, 2) }}');
            expect(s).to.be('2');

            s = render('{% macro foo(x, y, z=5) %}{{ y }}{% endmacro %}' +
                       '{{ foo(1, 2) }}');
            expect(s).to.be('2');

            s = render('{% macro foo(x, y, z=5) %}{{ z }}{% endmacro %}' +
                       '{{ foo(1, 2) }}');
            expect(s).to.be('5');

            s = render('{% macro foo(x, y, z=5) %}{{ y }}{% endmacro %}' +
                       '{{ foo(1, y=2) }}');
            expect(s).to.be('2');

            s = render('{% macro foo(x, y, z=5) %}{{ x }}{{ y }}{{ z }}' +
                       '{% endmacro %}' +
                       '{{ foo(x=1, y=2) }}');
            expect(s).to.be('125');

            s = render('{% macro foo(x, y, z=5) %}{{ x }}{{ y }}{{ z }}' +
                       '{% endmacro %}' +
                       '{{ foo(x=1, y=2, z=3) }}');
            expect(s).to.be('123');

            s = render('{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                       '{% endmacro %}' +
                       '{{ foo(1, z=3) }}');
            expect(s).to.be('123');

            s = render('{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                       '{% endmacro %}' +
                       '{{ foo(1) }}');
            expect(s).to.be('125');

            s = render('{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                       '{% endmacro %}' +
                       '{{ foo(1, 10, 20) }}');
            expect(s).to.be('11020');

            s = render('{% extends "base.html" %}' +
                       '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                       '{% endmacro %}' +
                       '{% block block1 %}' +
                       '{{ foo(1) }}' +
                       '{% endblock %}');
            expect(s).to.be('Foo125BazFizzle');

            s = render('{% block bar %}' +
                       '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                       '{% endmacro %}' +
                       '{% endblock %}' +
                       '{% block baz %}' +
                       '{{ foo(1) }}' +
                       '{% endblock %}');
            expect(s).to.be('125');
        });

        it('should import templates', function() {
            var s = render('{% import "import.html" as imp %}' +
                           '{{ imp.foo() }} {{ imp.bar }}');
            expect(s).to.be("Here's a macro baz");

            s = render('{% from "import.html" import foo as baz, bar %}' +
                       '{{ bar }} {{ baz() }}');
            expect(s).to.be("baz Here's a macro");

            s = render('{% for i in [1,2] %}' +
                       'start: {{ num }}' +
                       '{% from "import.html" import bar as num %}' +
                       'end: {{ num }}' +
                       '{% endfor %}' +
                       'final: {{ num }}');
            // TODO: Should the for loop create a new frame for each
            // iteration? As it is, `num` is set on all iterations after
            // the first one sets it
            expect(s).to.be('start: end: bazstart: bazend: bazfinal: ');
        });

        it('should inherit templates', function() {
            var s = render('{% extends "base.html" %}');
            expect(s).to.be('FooBarBazFizzle');

            s = render('hola {% extends "base.html" %} hizzle mumble');
            expect(s).to.be('FooBarBazFizzle');

            s = render('{% extends "base.html" %}' +
                       '{% block block1 %}BAR{% endblock %}');
            expect(s).to.be('FooBARBazFizzle');

            s = render('{% extends "base.html" %}' +
                       '{% block block1 %}BAR{% endblock %}' +
                       '{% block block2 %}BAZ{% endblock %}');
            expect(s).to.be('FooBARBAZFizzle');

            s = render('hola {% extends tmpl %} hizzle mumble',
                       { tmpl: 'base.html' });
            expect(s).to.be('FooBarBazFizzle');

            var count = 0;
            render('{% extends "base.html" %}' + 
                   '{% block notReal %}{{ foo() }}{% endblock %}',
                   {
                       foo: function() {
                           count++;
                       }
                   });
            expect(count).to.be(0);
        });

        it('should render nested blocks in child template', function() {
            var s = render('{% extends "base.html" %}' +
                           '{% block block1 %}{% block nested %}BAR{% endblock %}{% endblock %}');
            expect(s).to.be('FooBARBazFizzle');
        });

        it('should render parent blocks with super()', function() {
            var s = render('{% extends "base.html" %}' +
                           '{% block block1 %}{{ super() }}BAR{% endblock %}');
            expect(s).to.be('FooBarBARBazFizzle');

            // two levels of `super` should work 
            s = render('{% extends "base-inherit.html" %}' +
                       '{% block block1 %}*{{ super() }}*{% endblock %}');
            expect(s).to.be('Foo**Bar**BazFizzle');
        });

        it('should include templates', function() {
            var s = render('hello world {% include "include.html" %}');
            expect(s).to.be('hello world FooInclude ');

            s = render('hello world {% include "include.html" %}',
                       { name: 'james' });
            expect(s).to.be('hello world FooInclude james');

            s = render('hello world {% include tmpl %}',
                       { name: 'thedude', tmpl: "include.html" });
            expect(s).to.be('hello world FooInclude thedude');

            s = render('hello world {% include data.tmpl %}',
                       { name: 'thedude', data: {tmpl: "include.html"} });
            expect(s).to.be('hello world FooInclude thedude');
        });

        it('should maintain nested scopes', function() {
            var s = render('{% for i in [1,2] %}' +
                           '{% for i in [3,4] %}{{ i }}{% endfor %}' +
                           '{{ i }}{% endfor %}');
            expect(s).to.be('341342');
        });

        it('should allow blocks in for loops', function() {
            var s = render('{% extends "base2.html" %}' +
                           '{% block item %}hello{{ item }}{% endblock %}');
            expect(s).to.be('hello1hello2');
        });

        it('should make includes inherit scope', function() {
            var s = render('{% for item in [1,2] %}' +
                           '{% include "item.html" %}' +
                           '{% endfor %}');
            expect(s).to.be('showing 1showing 2');
        });

        it('should compile a set block', function() {
            var s = render('{% set username = "foo" %}{{ username }}',
                           { username: 'james' });
            expect(s).to.be('foo');

            s = render('{% set x, y = "foo" %}{{ x }}{{ y }}');
            expect(s).to.be('foofoo');

            s = render('{% set x = 1 + 2 %}{{ x }}');
            expect(s).to.be('3');

            s = render('{% for i in [1] %}{% set foo=1 %}{% endfor %}{{ foo }}',
                       { foo: 2 });
            expect(s).to.be('2');

            s = render('{% include "set.html" %}{{ foo }}',
                       { foo: 'bar' });
            expect(s).to.be('bar');
        });

        it('should compile set with frame references', function() {
            var s = render('{% set username = user.name %}{{ username }}',
                           { user: { name: 'james' } });
            expect(s).to.be('james');
        });

        it('should compile set assignments of the same variable', function() {
            var s = render('{% set x = "hello" %}' +
                           '{% if false %}{% set x = "world" %}{% endif %}' +
                           '{{ x }}');
            expect(s).to.be('hello');

            s = render('{% set x = "blue" %}' +
                       '{% if true %}{% set x = "green" %}{% endif %}' +
                       '{{ x }}');
            expect(s).to.be('green');
        });

        it('should throw errors', function() {
            expect(function() {
                render('{% from "import.html" import boozle %}');
            }).to.throwException(/cannot import 'boozle'/);
        });

        it('should allow custom tag compilation', function() {
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
            var output = render('{% test %}123456789{% endtest %}', null, opts);
            expect(output).to.be('987654321');

        });

        it('should allow complicated custom tag compilation', function() {
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

            var output = render('{% test %}abcdefg{% endtest %}', null, opts);
            expect(output).to.be('a,b,c,d,e,f,g');

            output = render(
                '{% test %}abcdefg{% intermediate %}second half{% endtest %}',
                null, 
                opts
            );
            expect(output).to.be('a,b,c,d,e,f,gflah dnoces');
        });

        it('should allow custom tag with args compilation', function() {
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

            var output = render('{% test %}foobar{% endtest %}', null, opts);
            expect(output).to.be('raboof');

            output = render('{% test("biz") %}foobar{% endtest %}', null, opts);
            expect(output).to.be('bizraboof');

            output = render('{% test("biz", cutoff=5) %}foobar{% endtest %}', null, opts);
            expect(output).to.be('bizra');
        });

        it('should not autoescape by default', function() {
            var s = render('{{ foo }}', { foo: '"\'<>&'});
            expect(s).to.be('"\'<>&');
        });

        it('should autoescape if autoescape is on', function() {
            var s = render('{{ foo }}', { foo: '"\'<>&'}, { autoescape: true });
            expect(s).to.be('&quot;&#39;&lt;&gt;&amp;');

            var s = render('{{ foo|reverse }}', { foo: '"\'<>&'}, { autoescape: true });
            expect(s).to.be('&amp;&gt;&lt;&#39;&quot;');

            var s = render('{{ foo|reverse|safe }}', { foo: '"\'<>&'}, { autoescape: true });
            expect(s).to.be('&><\'"');
        });

        it('should not autoescape safe strings', function() {
            var s = render('{{ foo|safe }}', { foo: '"\'<>&'}, { autoescape: true });
            expect(s).to.be('"\'<>&');
        });

        it('should not autoescape macros', function() {
            var s = render(
                '{% macro foo(x, y) %}{{ x }} and {{ y }}{% endmacro %}' +
                    '{{ foo("<>&", "<>") }}',
                null,
                { autoescape: true }
            );
            expect(s).to.be('&lt;&gt;&amp; and &lt;&gt;');

            var s = render(
                '{% macro foo(x, y) %}{{ x|safe }} and {{ y }}{% endmacro %}' +
                    '{{ foo("<>&", "<>") }}',
                null,
                { autoescape: true }
            );
            expect(s).to.be('<>& and &lt;&gt;');
        });
    });
})();
