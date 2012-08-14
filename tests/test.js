
var should = require('should');
var _ = require('underscore');
var util = require('util');
var lexer = require('../src/lexer');
var parser = require('../src/parser');
var compiler = require('../src/compiler');
var nodes = require('../src/nodes');
var render = require('./util').render;

function _hasTokens(ws, tokens, types) {
    _.each(types, function(type) {
        var tok = tokens.nextToken();

        if(!ws) {
            while(tok && tok.type == lexer.TOKEN_WHITESPACE) {
                tok = tokens.nextToken();
            }
        }

        if(_.isArray(type)) {
            tok.type.should.equal(type[0]);
            tok.value.should.equal(type[1]);
        }
        else {
            tok.type.should.equal(type);
        }
    });
}

function hasTokens(tokens /*, types */) {
    return _hasTokens(false, tokens, _.toArray(arguments).slice(1));
}

function hasTokensWithWS(tokens /*, types */) {
    return _hasTokens(true, tokens, _.toArray(arguments).slice(1));
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
    if(!(ast && _.isArray(ast))) {
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
        return new type(0,
                        0,
                        toNodes(ast[0]),
                        _.map(ast.slice(1), toNodes));
    }
    else {
        return new type(0, 0, _.map(ast.slice(1), toNodes));
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
        var ifn = n.children[1];
        ifn.typename.should.equal('If');
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

        // (function() {
        //     parser.parse('hello {% if sdf %} data');
        // }).should.throw(/expected block end/);

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

    it('should compile if blocks', function() {
        var tmpl = ('Give me some {% if hungry %}pizza' + 
                    '{% else %}water{% endif %}');

        var s = render(tmpl, { hungry: true });
        s.should.equal('Give me some pizza');

        s = render(tmpl, { hungry: false });
        s.should.equal('Give me some water');
    });
});