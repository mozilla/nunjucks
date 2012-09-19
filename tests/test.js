
var should = require('should');
var util = require('util');
var lib = require('../src/lib');
var lexer = require('../src/lexer');
var parser = require('../src/parser');
var compiler = require('../src/compiler');
var nodes = require('../src/nodes');
var render = require('./util').render;

function _hasTokens(ws, tokens, types) {
    for(var i=0; i<types.length; i++) {
        var type = types[i];
        var tok = tokens.nextToken();

        if(!ws) {
            while(tok && tok.type == lexer.TOKEN_WHITESPACE) {
                tok = tokens.nextToken();
            }
        }

        if(lib.isArray(type)) {
            tok.type.should.equal(type[0]);
            tok.value.should.equal(type[1]);
        }
        else {
            tok.type.should.equal(type);
        }
    }
}

function hasTokens(tokens /*, types */) {
    return _hasTokens(false, tokens, lib.toArray(arguments).slice(1));
}

function hasTokensWithWS(tokens /*, types */) {
    return _hasTokens(true, tokens, lib.toArray(arguments).slice(1));
}

function _isAST(node1, node2) {
    // Compare ASTs
    // TODO: spend more than 30 seconds on this, clean up

    node2.typename.should.equal(node1.typename);

    var prefix = node2.typename + ': num-children: ';
    (prefix + node2.numChildren()).should.equal(
        (prefix + node1.numChildren())
    );

    if(node2.value) {
        node2.value.should.equal(node1.value);
    }

    if(node2 instanceof nodes.If) {
        _isAST(node2.cond, node1.cond);
        _isAST(node2.body, node1.body);

        if(node2.else_) {
            //node1.else_.should.not.equal(null);
            _isAST(node2.else_, node1.else_);
        }
        else {
            node1.else_.should.equal(null);
        }
    }
    else {
        if(node2 instanceof nodes.FunCall) {
            _isAST(node2.name, node1.name);
        }

        for(var i=0; i<node2.children.length; i++) {
            _isAST(node2.children[i], node1.children[i]);
        }
    }
}

function isAST(node1, ast) {
    // Compare the ASTs, the second one is an AST literal so transform
    // it into a real one
    return _isAST(node1, toNodes(ast));
}

function toNodes(ast) {
    if(!(ast && lib.isArray(ast))) {
        return ast;
    }

    // We'll be doing a lot of AST comparisons, so this defines a kind
    // of "AST literal" that you can specify with arrays. This
    // transforms it into a real AST.

    var type = ast[0];
    var dummy = Object.create(type.prototype);

    // Translate the array into a constructor call for the specific
    // type (requires special knowledge of the function signatures)
    //
    // TODO: spend more than 30 seconds on this code and clean up
    if(dummy instanceof nodes.Value ||
       dummy instanceof nodes.Pair ||
       dummy instanceof nodes.If) {
        return new type(0,
                        0,
                        toNodes(ast[1]),
                        toNodes(ast[2]),
                        toNodes(ast[3]));
    }
    else if(dummy instanceof nodes.FunCall) {
        var args = ast.slice(2);
        return new type(0,
                        0,
                        toNodes(ast[1]),
                        lib.map(args, toNodes));
    }
    else {
        return new type(0, 0, lib.map(ast.slice(1), toNodes));
    }
}

describe('lexer', function() {
    var tok, tmpl, tokens;

    it('should parse template data', function() {
        tok = lexer.lex('3').nextToken();
        tok.type.should.equal(lexer.TOKEN_DATA);
        tok.value.should.equal('3');

        tmpl = 'foo bar bizzle 3 [1,2] !@#$%^&*()<>?:"{}|';
        tok = lexer.lex(tmpl).nextToken();
        tok.type.should.equal(lexer.TOKEN_DATA);
        tok.value.should.equal(tmpl);
    });

    it('should keep track of whitespace', function() {
        tokens = lexer.lex('data {% 1 2\n   3  %} data');
        hasTokensWithWS(tokens,
                        lexer.TOKEN_DATA,
                        lexer.TOKEN_BLOCK_START,
                        [lexer.TOKEN_WHITESPACE, ' '],
                        lexer.TOKEN_INT,
                        [lexer.TOKEN_WHITESPACE, ' '],
                        lexer.TOKEN_INT,
                        [lexer.TOKEN_WHITESPACE, '\n   '],
                        lexer.TOKEN_INT,
                        [lexer.TOKEN_WHITESPACE, '  '],
                        lexer.TOKEN_BLOCK_END,
                        lexer.TOKEN_DATA);
    });

    it('should parse variable start and end', function() {
        tokens = lexer.lex('data {{ foo }} bar bizzle');
        hasTokens(tokens,
                  lexer.TOKEN_DATA,
                  lexer.TOKEN_VARIABLE_START,
                  lexer.TOKEN_SYMBOL,
                  lexer.TOKEN_VARIABLE_END,
                  lexer.TOKEN_DATA);
    });

    it('should parse block start and end', function() {
        tokens = lexer.lex('data {% foo %} bar bizzle');
        hasTokens(tokens,
                  lexer.TOKEN_DATA,
                  lexer.TOKEN_BLOCK_START,
                  lexer.TOKEN_SYMBOL,
                  lexer.TOKEN_BLOCK_END,
                  lexer.TOKEN_DATA);
    });

    it('should parse basic types', function() {
        tokens = lexer.lex('{{ 3 4.5 true false foo "hello" \'boo\' }}');
        hasTokens(tokens,
                  lexer.TOKEN_VARIABLE_START,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_FLOAT,
                  lexer.TOKEN_BOOLEAN,
                  lexer.TOKEN_BOOLEAN,
                  lexer.TOKEN_SYMBOL,
                  lexer.TOKEN_STRING,
                  lexer.TOKEN_STRING,
                  lexer.TOKEN_VARIABLE_END);
    }),

    it('should parse function calls', function() {
        tokens = lexer.lex('{{ foo(bar) }}');
        hasTokens(tokens,
                  lexer.TOKEN_VARIABLE_START,
                  [lexer.TOKEN_SYMBOL, 'foo'],
                  lexer.TOKEN_LEFT_PAREN,
                  [lexer.TOKEN_SYMBOL, 'bar'],
                  lexer.TOKEN_RIGHT_PAREN,
                  lexer.TOKEN_VARIABLE_END);
    });

    it('should parse groups', function() {
        tokens = lexer.lex('{{ (1, 2, 3) }}');
        hasTokens(tokens,
                  lexer.TOKEN_VARIABLE_START,
                  lexer.TOKEN_LEFT_PAREN,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_COMMA,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_COMMA,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_RIGHT_PAREN,
                  lexer.TOKEN_VARIABLE_END);
    });

    it('should parse arrays', function() {
        tokens = lexer.lex('{{ [1, 2, 3] }}');
        hasTokens(tokens,
                  lexer.TOKEN_VARIABLE_START,
                  lexer.TOKEN_LEFT_BRACKET,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_COMMA,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_COMMA,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_RIGHT_BRACKET,
                  lexer.TOKEN_VARIABLE_END);
    });

    it('should parse dicts', function() {
        tokens = lexer.lex('{{ {one:1, "two":2} }}');
        hasTokens(tokens,
                  lexer.TOKEN_VARIABLE_START,
                  lexer.TOKEN_LEFT_CURLY,
                  [lexer.TOKEN_SYMBOL, 'one'],
                  lexer.TOKEN_COLON,
                  [lexer.TOKEN_INT, '1'],
                  lexer.TOKEN_COMMA,
                  [lexer.TOKEN_STRING, 'two'],
                  lexer.TOKEN_COLON,
                  [lexer.TOKEN_INT, '2'],
                  lexer.TOKEN_RIGHT_CURLY,
                  lexer.TOKEN_VARIABLE_END);
    });

    it('should parse blocks without whitespace', function() {
        tokens = lexer.lex('data{{hello}}{%if%}data');
        hasTokens(tokens,
                  lexer.TOKEN_DATA,
                  lexer.TOKEN_VARIABLE_START,
                  [lexer.TOKEN_SYMBOL, 'hello'],
                  lexer.TOKEN_VARIABLE_END,
                  lexer.TOKEN_BLOCK_START,
                  [lexer.TOKEN_SYMBOL, 'if'],
                  lexer.TOKEN_BLOCK_END,
                  lexer.TOKEN_DATA);
    });

    it('should parse filters', function() {
        hasTokens(lexer.lex('{{ foo|bar }}'),
                  lexer.TOKEN_VARIABLE_START,
                  [lexer.TOKEN_SYMBOL, 'foo'],
                  lexer.TOKEN_PIPE,
                  [lexer.TOKEN_SYMBOL, 'bar'],
                  lexer.TOKEN_VARIABLE_END);
    }),

    it('should parse operators', function() {
        hasTokens(lexer.lex('{{ 3+3-3*3/3 }}'),
                  lexer.TOKEN_VARIABLE_START,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_OPERATOR,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_OPERATOR,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_OPERATOR,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_OPERATOR,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_VARIABLE_END);

        hasTokens(lexer.lex('{{ 3**4//5 }}'),
                  lexer.TOKEN_VARIABLE_START,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_OPERATOR,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_OPERATOR,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_VARIABLE_END);

        hasTokens(lexer.lex('{{ 3 != 4 == 5 <= 6 >= 7 < 8 > 9 }}'),
                  lexer.TOKEN_VARIABLE_START,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_OPERATOR,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_OPERATOR,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_OPERATOR,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_OPERATOR,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_OPERATOR,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_OPERATOR,
                  lexer.TOKEN_INT,
                  lexer.TOKEN_VARIABLE_END);
    }),

    it('should parse comments', function() {
        tokens = lexer.lex('data data {# comment #} data');
        hasTokens(tokens,
                  lexer.TOKEN_DATA,
                  lexer.TOKEN_COMMENT,
                  lexer.TOKEN_DATA);
    });
});

describe('parser', function() {
    it('should parse basic types', function() {
        isAST(parser.parse('{{ 1 }}'),
              [nodes.Root,
               [nodes.Output,
                [nodes.Literal, 1]]]);

        isAST(parser.parse('{{ 4.567 }}'),
              [nodes.Root,
               [nodes.Output,
                [nodes.Literal, 4.567]]]);

        isAST(parser.parse('{{ "foo" }}'),
              [nodes.Root,
               [nodes.Output,
                [nodes.Literal, 'foo']]]);

        isAST(parser.parse("{{ 'foo' }}"),
              [nodes.Root,
               [nodes.Output,
                [nodes.Literal, 'foo']]]);

        isAST(parser.parse("{{ true }}"),
              [nodes.Root,
               [nodes.Output,
                [nodes.Literal, true]]]);

        isAST(parser.parse("{{ false }}"),
              [nodes.Root,
               [nodes.Output,
                [nodes.Literal, false]]]);

        isAST(parser.parse("{{ foo }}"),
              [nodes.Root,
               [nodes.Output,
                [nodes.Symbol, 'foo']]]);
    });

    it('should parse aggregate types', function() {
        isAST(parser.parse("{{ [1,2,3] }}"),
              [nodes.Root,
               [nodes.Output,
                [nodes.Array,
                 [nodes.Literal, 1],
                 [nodes.Literal, 2],
                 [nodes.Literal, 3]]]]);

        isAST(parser.parse("{{ (1,2,3) }}"),
              [nodes.Root,
               [nodes.Output,
                [nodes.Group,
                 [nodes.Literal, 1],
                 [nodes.Literal, 2],
                 [nodes.Literal, 3]]]]);

        isAST(parser.parse("{{ {foo: 1, 'two': 2} }}"),
              [nodes.Root,
               [nodes.Output,
                [nodes.Dict,
                 [nodes.Pair,
                  [nodes.Symbol, 'foo'],
                  [nodes.Literal, 1]],
                 [nodes.Pair,
                  [nodes.Literal, 'two'],
                  [nodes.Literal, 2]]]]]);
    });

    it('should parse variables', function() {
        isAST(parser.parse('hello {{ foo }}, how are you'),
              [nodes.Root,
               [nodes.Output, [nodes.TemplateData, 'hello ']],
               [nodes.Output, [nodes.Symbol, 'foo']],
               [nodes.Output, [nodes.TemplateData, ', how are you']]]);
    });

    it('should parse blocks', function() {
        var n = parser.parse('want some {% if hungry %}pizza{% else %}' +
                             'water{% endif %}?');
        n.children[1].typename.should.equal('If');

        n = parser.parse('{% block foo %}stuff{% endblock %}');
        n.children[0].typename.should.equal('Block');

        n = parser.parse('{% extends "test.html" %}stuff');
        n.children[0].typename.should.equal('Extends');

        n = parser.parse('{% include "test.html" %}');
        n.children[0].typename.should.equal('Include');
    });

    it('should parse filters', function() {
        isAST(parser.parse('{{ foo | bar }}'),
              [nodes.Root,
               [nodes.Output, 
                [nodes.Filter,
                 [nodes.Symbol, 'bar'],
                 [nodes.Symbol, 'foo']]]]);

        isAST(parser.parse('{{ foo | bar | baz }}'),
              [nodes.Root,
               [nodes.Output,
                [nodes.Filter,
                 [nodes.Symbol, 'baz'],
                 [nodes.Filter,
                  [nodes.Symbol, 'bar'],
                  [nodes.Symbol, 'foo']]]]]);

        isAST(parser.parse('{{ foo | bar(3) }}'),
              [nodes.Root,
               [nodes.Output, 
                [nodes.Filter,
                 [nodes.Symbol, 'bar'],
                 [nodes.Symbol, 'foo'],
                 [nodes.Literal, 3]]]]);
    });

    it('should throw errors', function() {
        (function() {
            parser.parse('hello {{ foo');
        }).should.throw(/expected variable end/);

        (function() {
            parser.parse('hello {% if');
        }).should.throw(/expected expression/);

        (function() {
            parser.parse('hello {% if sdf zxc');
        }).should.throw(/expected block end/);

        (function() {
            parser.parse('hello {% if sdf %} data');
        }).should.throw(/expected endif, else, or endif/);

        (function() {
            parser.parse('hello {% block sdf %} data');
        }).should.throw(/expected endblock/);

        (function() {
            parser.parse('hello {% bar %} dsfsdf');
        }).should.throw(/unknown block tag/);
    });
});

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

    it('should compile references', function() {
        var s = render('{{ foo.bar }}',
                       { foo: { bar: 'baz' }});
        s.should.equal('baz');

        s = render('{{ foo["bar"] }}',
                   { foo: { bar: 'baz' }});
        s.should.equal('baz');
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
    });

    it('should compile for blocks', function() {
        var s = render('{% for i in arr %}{{ i }}{% endfor %}',
                       { arr: [1, 2, 3, 4, 5] });
        s.should.equal('12345');

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
    });

    it('should render parent blocks with super()', function() {
        var s = render('{% extends "base.html" %}' +
                       '{% block block1 %}{{ super() }}BAR{% endblock %}');
        s.should.equal('FooBarBARBazFizzle');
    });

    it('should include templates', function() {
        var s = render('hello world {% include "include.html" %}');
        s.should.equal('hello world FooInclude ');

        s = render('hello world {% include "include.html" %}',
                  { name: 'james' });
        s.should.equal('hello world FooInclude james');
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

        var s = render('{% set x, y = "foo" %}{{ x }}{{ y }}');
        s.should.equal('foofoo');
    });
});