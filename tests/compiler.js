var should = require('should');

var compiler = require('../src/compiler');
var env = require('../src/environment');
var render = require('./util').render;

describe('compiler', function() {
    it('should compile templates', function() {
        var s = render('Hello world');
        s.should.equal('Hello world');

        s = render('Hello world, {{ name }}',
                   { name: 'James' });
        s.should.equal('Hello world, James');

        s = render('Hello world, {{name}}{{suffix}}, how are you',
                   { name: 'James',
                     suffix: ' Long'});
        s.should.equal('Hello world, James Long, how are you');
    });

    it('should escape newlines', function() {
        render('foo\\nbar').should.equal('foo\\nbar');
    });

    it('should compile references', function() {
        var s = render('{{ foo.bar }}',
                       { foo: { bar: 'baz' }});
        s.should.equal('baz');

        s = render('{{ foo["bar"] }}',
                   { foo: { bar: 'baz' }});
        s.should.equal('baz');
    });

    it('should fail silently on undefined values', function() {
        var s = render('{{ foo }}');
        s.should.equal('');

        s = render('{{ foo.bar }}');
        s.should.equal('');

        s = render('{{ foo.bar.baz }}');
        s.should.equal('');

        s = render('{{ foo.bar.baz["biz"].mumble }}');
        s.should.equal('');
    });

    it('should not treat falsy values the same as undefined', function() {
        var s = render('{{ foo }}', {foo: 0});
        s.should.equal('0');

        s = render('{{ foo }}', {foo: false});
        s.should.equal('false');
    });

    it('should compile function calls', function() {
        var s = render('{{ foo("msg") }}',
                       { foo: function(str) { return str + 'hi'; }});
        s.should.equal('msghi');
    });

    it('should compile function calls with correct scope', function() {
        var s = render('{{ foo.bar() }}', {
            foo: { 
                bar: function() { return this.baz; },
                baz: 'hello'
            }
        });

        s.should.equal('hello');
    });

    it('should compile if blocks', function() {
        var tmpl = ('Give me some {% if hungry %}pizza' +
                    '{% else %}water{% endif %}');

        var s = render(tmpl, { hungry: true });
        s.should.equal('Give me some pizza');

        s = render(tmpl, { hungry: false });
        s.should.equal('Give me some water');

        s = render('{% if not hungry %}good{% endif %}',
                   { hungry: false });
        s.should.equal('good');

        s = render('{% if hungry and like_pizza %}good{% endif %}',
            { hungry: true, like_pizza: true });
        s.should.equal('good');

        s = render('{% if hungry or like_pizza %}good{% endif %}',
            { hungry: false, like_pizza: true });
        s.should.equal('good');

        s = render('{% if (hungry or like_pizza) and anchovies %}good{% endif %}',
            { hungry: false, like_pizza: true, anchovies: true });
        s.should.equal('good');

        s = render('{% if food == "pizza" %}pizza{% endif %}' +
                   '{% if food =="beer" %}beer{% endif %}',
                  { food: 'beer' });
        s.should.equal('beer');
    });

    it('should compile inline conditionals', function() {
        var tmpl = 'Give me some {{ "pizza" if hungry else "water" }}';

        var s = render(tmpl, { hungry: true });
        s.should.equal('Give me some pizza');

        s = render(tmpl, { hungry: false });
        s.should.equal('Give me some water');

        s = render('{{ "good" if not hungry }}',
                   { hungry: false });
        s.should.equal('good');

        s = render('{{ "good" if hungry and like_pizza }}',
            { hungry: true, like_pizza: true });
        s.should.equal('good');

        s = render('{{ "good" if hungry or like_pizza }}',
            { hungry: false, like_pizza: true });
        s.should.equal('good');

        s = render('{{ "good" if (hungry or like_pizza) and anchovies }}',
            { hungry: false, like_pizza: true, anchovies: true });
        s.should.equal('good');

        s = render('{{ "pizza" if food == "pizza" }}' +
                   '{{ "beer" if food == "beer" }}',
                  { food: 'beer' });
        s.should.equal('beer');
    });

    it('should compile for blocks', function() {
        var s = render('{% for i in arr %}{{ i }}{% endfor %}',
                       { arr: [1, 2, 3, 4, 5] });
        s.should.equal('12345');

        s = render('{% for a, b, c in arr %}' +
                       '{{ a }},{{ b }},{{ c }}.{% endfor %}',
                       { arr: [['x', 'y', 'z'], ['1', '2', '3']] });
        s.should.equal('x,y,z.1,2,3.');

        s = render('{% for item in arr | batch(2) %}{{ item[0] }}{% endfor %}',
                   { arr: ['a', 'b', 'c', 'd'] });
        s.should.equal('ac');

        s = render('{% for k, v in { one: 1, two: 2 } %}' +
                   '-{{ k }}:{{ v }}-{% endfor %}');
        s.should.equal('-one:1--two:2-');

        s = render('{% for i in [7,3,6] %}{{ loop.index }}{% endfor %}');
        s.should.equal('123');

        s = render('{% for i in [7,3,6] %}{{ loop.index0 }}{% endfor %}');
        s.should.equal('012');

        s = render('{% for i in [7,3,6] %}{{ loop.revindex }}{% endfor %}');
        s.should.equal('321');

        s = render('{% for i in [7,3,6] %}{{ loop.revindex0 }}{% endfor %}');
        s.should.equal('210');

        s = render('{% for i in [7,3,6] %}{% if loop.first %}{{ i }}{% endif %}{% endfor %}');
        s.should.equal('7');

        s = render('{% for i in [7,3,6] %}{% if loop.last %}{{ i }}{% endif %}{% endfor %}');
        s.should.equal('6');

        s = render('{% for i in [7,3,6] %}{{ loop.length }}{% endfor %}');
        s.should.equal('333');

        s = render('{% for i in foo %}{{ i }}{% endfor %}');
        s.should.equal('');

        s = render('{% for i in foo.bar %}{{ i }}{% endfor %}', { foo: {} });
        s.should.equal('');
    });

    it('should compile operators', function() {
        render('{{ 3 + 4 - 5 * 6 / 10 }}').should.equal('4');
        render('{{ 4**5 }}').should.equal('1024');
        render('{{ 9//5 }}').should.equal('1');
        render('{{ 9%5 }}').should.equal('4');
        render('{{ -5 }}').should.equal('-5');

        render('{% if 3 < 4 %}yes{% endif %}').should.equal('yes');
        render('{% if 3 > 4 %}yes{% endif %}').should.equal('');
        render('{% if 9 >= 10 %}yes{% endif %}').should.equal('');
        render('{% if 10 >= 10 %}yes{% endif %}').should.equal('yes');
        render('{% if 9 <= 10 %}yes{% endif %}').should.equal('yes');
        render('{% if 10 <= 10 %}yes{% endif %}').should.equal('yes');
        render('{% if 11 <= 10 %}yes{% endif %}').should.equal('');

        render('{% if 10 != 10 %}yes{% endif %}').should.equal('');
        render('{% if 10 == 10 %}yes{% endif %}').should.equal('yes');

        render('{% if foo(20) > bar %}yes{% endif %}',
               { foo: function(n) { return n - 1; },
                 bar: 15 })
            .should.equal('yes');
    });

    it('should compile macros', function() {
        var s = render('{% macro foo() %}This is a macro{% endmacro %}' +
                       '{{ foo() }}');
        s.should.equal('This is a macro');

        s = render('{% macro foo(x, y) %}{{ y }}{% endmacro %}' +
                   '{{ foo(1) }}');
        s.should.equal('');

        s = render('{% macro foo(x, y) %}{{ y }}{% endmacro %}' +
                   '{{ foo(1, 2) }}');
        s.should.equal('2');

        s = render('{% macro foo(x, y, z=5) %}{{ y }}{% endmacro %}' +
                   '{{ foo(1, 2) }}');
        s.should.equal('2');

        s = render('{% macro foo(x, y, z=5) %}{{ z }}{% endmacro %}' +
                   '{{ foo(1, 2) }}');
        s.should.equal('5');

        s = render('{% macro foo(x, y, z=5) %}{{ y }}{% endmacro %}' +
                   '{{ foo(1, y=2) }}');
        s.should.equal('2');

        s = render('{% macro foo(x, y, z=5) %}{{ x }}{{ y }}{{ z }}' +
                   '{% endmacro %}' +
                   '{{ foo(x=1, y=2) }}');
        s.should.equal('125');

        s = render('{% macro foo(x, y, z=5) %}{{ x }}{{ y }}{{ z }}' +
                   '{% endmacro %}' +
                   '{{ foo(x=1, y=2, z=3) }}');
        s.should.equal('123');

        s = render('{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                   '{% endmacro %}' +
                   '{{ foo(1, z=3) }}');
        s.should.equal('123');

        s = render('{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                   '{% endmacro %}' +
                   '{{ foo(1) }}');
        s.should.equal('125');

        s = render('{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                   '{% endmacro %}' +
                   '{{ foo(1, 10, 20) }}');
        s.should.equal('11020');

        s = render('{% extends "base.html" %}' +
                   '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                   '{% endmacro %}' +
                   '{% block block1 %}' +
                   '{{ foo(1) }}' +
                   '{% endblock %}');
        s.should.equal('Foo125BazFizzle');

        s = render('{% block bar %}' +
                   '{% macro foo(x, y=2, z=5) %}{{ x }}{{ y }}{{ z }}' +
                   '{% endmacro %}' +
                   '{% endblock %}' +
                   '{% block baz %}' +
                   '{{ foo(1) }}' +
                   '{% endblock %}');
        s.should.equal('125');
    });

    it('should import templates', function() {
        var s = render('{% import "import.html" as imp %}' +
                       '{{ imp.foo() }} {{ imp.bar }}');
        s.should.equal("Here's a macro baz");

        s = render('{% from "import.html" import foo as baz, bar %}' +
                       '{{ bar }} {{ baz() }}');
        s.should.equal("baz Here's a macro");

        s = render('{% for i in [1,2] %}' +
                   'start: {{ num }}' +
                   '{% from "import.html" import bar as num %}' +
                   'end: {{ num }}' +
                   '{% endfor %}' +
                   'final: {{ num }}');
        // TODO: Should the for loop create a new frame for each
        // iteration? As it is, `num` is set on all iterations after
        // the first one sets it
        s.should.equal('start: end: bazstart: bazend: bazfinal: ');
    });

    it('should inherit templates', function() {
        var s = render('{% extends "base.html" %}');
        s.should.equal('FooBarBazFizzle');

        s = render('hola {% extends "base.html" %} hizzle mumble');
        s.should.equal('FooBarBazFizzle');

        s = render('{% extends "base.html" %}' +
                   '{% block block1 %}BAR{% endblock %}');
        s.should.equal('FooBARBazFizzle');

        s = render('{% extends "base.html" %}' +
                   '{% block block1 %}BAR{% endblock %}' +
                   '{% block block2 %}BAZ{% endblock %}');
        s.should.equal('FooBARBAZFizzle');

        s = render('hola {% extends tmpl %} hizzle mumble',
                   { tmpl: 'base.html' });
        s.should.equal('FooBarBazFizzle');
    });

    it('should render parent blocks with super()', function() {
        var s = render('{% extends "base.html" %}' +
                       '{% block block1 %}{{ super() }}BAR{% endblock %}');
        s.should.equal('FooBarBARBazFizzle');

        // two levels of `super` should work 
        s = render('{% extends "base-inherit.html" %}' +
                   '{% block block1 %}*{{ super() }}*{% endblock %}');
        s.should.equal('Foo**Bar**BazFizzle');
    });

    it('should include templates', function() {
        var s = render('hello world {% include "include.html" %}');
        s.should.equal('hello world FooInclude ');

        s = render('hello world {% include "include.html" %}',
                  { name: 'james' });
        s.should.equal('hello world FooInclude james');

        s = render('hello world {% include tmpl %}',
                  { name: 'thedude', tmpl: "include.html" });
        s.should.equal('hello world FooInclude thedude');

        s = render('hello world {% include data.tmpl %}',
            { name: 'thedude', data: {tmpl: "include.html"} });
        s.should.equal('hello world FooInclude thedude');
    });

    it('should maintain nested scopes', function() {
        var s = render('{% for i in [1,2] %}' +
                       '{% for i in [3,4] %}{{ i }}{% endfor %}' +
                       '{{ i }}{% endfor %}');
        s.should.equal('341342');
    });

    it('should allow blocks in for loops', function() {
        var s = render('{% extends "base2.html" %}' +
                       '{% block item %}hello{{ item }}{% endblock %}');
        s.should.equal('hello1hello2');
    });

    it('should make includes inherit scope', function() {
        var s = render('{% for item in [1,2] %}' +
                       '{% include "item.html" %}' +
                       '{% endfor %}');
        s.should.equal('showing 1showing 2');
    });

    it('should compile a set block', function() {
        var s = render('{% set username = "foo" %}{{ username }}',
                       { username: 'james' });
        s.should.equal('foo');

        s = render('{% set x, y = "foo" %}{{ x }}{{ y }}');
        s.should.equal('foofoo');

        s = render('{% set x = 1 + 2 %}{{ x }}');
        s.should.equal('3');

        s = render('{% for i in [1] %}{% set foo=1 %}{% endfor %}{{ foo }}',
                   { foo: 2 });
        s.should.equal('2');

        s = render('{% include "set.html" %}{{ foo }}',
                   { foo: 'bar' });
        s.should.equal('bar');
    });

    it('should compile set with frame references', function() {
        var s = render('{% set username = user.name %}{{ username }}',
                       { user: { name: 'james' } });
        s.should.equal('james');
    });

    it('should compile set assignments of the same variable', function() {
        var s = render('{% set x = "hello" %}' +
                       '{% if false %}{% set x = "world" %}{% endif %}' +
                       '{{ x }}');
        s.should.equal('hello');

        s = render('{% set x = "blue" %}' +
                   '{% if true %}{% set x = "green" %}{% endif %}' +
                   '{{ x }}');
        s.should.equal('green');
    });

    it('should throw errors', function() {
        (function() {
            render('{% from "import.html" import boozle %}');
        }).should.throw(/cannot import 'boozle'/);
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
        output.should.equal('987654321');

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
        output.should.equal('a,b,c,d,e,f,g');

        output = render(
            '{% test %}abcdefg{% intermediate %}second half{% endtest %}',
            null, 
            opts
        );
        output.should.equal('a,b,c,d,e,f,gflah dnoces');
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
        output.should.equal('raboof');

        output = render('{% test("biz") %}foobar{% endtest %}', null, opts);
        output.should.equal('bizraboof');

        output = render('{% test("biz", cutoff=5) %}foobar{% endtest %}', null, opts);
        output.should.equal('bizra');
    });

    it('should not autoescape by default', function() {
        var s = render('{{ foo }}', { foo: '"\'<>&'});
        s.should.equal('"\'<>&');
    });

    it('should autoescape if autoescape is on', function() {
        var s = render('{{ foo }}', { foo: '"\'<>&'}, { autoescape: true });
        s.should.equal('&quot;&#39;&lt;&gt;&amp;');

        var s = render('{{ foo|reverse }}', { foo: '"\'<>&'}, { autoescape: true });
        s.should.equal('&amp;&gt;&lt;&#39;&quot;');

        var s = render('{{ foo|reverse|safe }}', { foo: '"\'<>&'}, { autoescape: true });
        s.should.equal('&><\'"');
    });

    it('should not autoescape safe strings', function() {
        var s = render('{{ foo|safe }}', { foo: '"\'<>&'}, { autoescape: true });
        s.should.equal('"\'<>&');
    });

    it('should not autoescape macros', function() {
        var s = render(
            '{% macro foo(x, y) %}{{ x }} and {{ y }}{% endmacro %}' +
            '{{ foo("<>&", "<>") }}',
            null,
            { autoescape: true }
        );
        s.should.equal('&lt;&gt;&amp; and &lt;&gt;');

        var s = render(
            '{% macro foo(x, y) %}{{ x|safe }} and {{ y }}{% endmacro %}' +
            '{{ foo("<>&", "<>") }}',
            null,
            { autoescape: true }
        );
        s.should.equal('<>& and &lt;&gt;');
    });
});
