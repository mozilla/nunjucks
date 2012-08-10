
var should = require('should');
var _ = require('underscore');
var lexer = require('../src/lexer');
var parser = require('../src/parser');
var compiler = require('../src/compiler');
var nodes = require('../src/nodes');

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
    node1.typename.should.equal(node2.typename);
    node1.numChildren().should.equal(node2.numChildren());

    if(node1.value) {
        node1.value.should.equal(node2.value);
    }

    if(node1 instanceof nodes.If) {
        isAST(node1.cond, node2.cond);
        isAST(node1.body, node2.body);
        isAST(node1.else_, node2.else_);
    }
    else {
        if(node1 instanceof nodes.FunCall) {
            isAST(node1.name, node2.name);
        }

        for(var i=0; i<node1.children.length; i++) {
            isAST(node1.children[i], node2.children[i]);
        }
    }
}

function isAST(node1, ast) {
    // Compare the ASTs, the second one is an AST literal so transform
    // it into a real one
    return _isAST(node1, toNodes(ast));
}

function toNodes(ast) {
    // We'll be doing a lot of AST comparisons, so this defines a kind
    // of "AST literal" that you can specify with arrays. This
    // transforms it into a real AST.

    var type = ast[0];
    var dummy = Object.create(type.prototype);

    // Translate the array into a constructor call for the specific
    // type (requires special knowledge of the function signatures)
    if(dummy instanceof nodes.Value ||
       dummy instanceof nodes.Pair ||
       dummy instanceof nodes.If) {
        return new type(0, 0, ast[1], ast[2], ast[3]);
    }
    else if(dummy instanceof nodes.FunCall) {
        return new type(0,
                        0,
                        ast[1],
                        ast.slice(2));
    }
    else {
        return new type(0, 0, ast.slice(1));
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
    it('should parse templates', function() {
        isAST(parser.parse('hello {{ foo }}'),
              [nodes.Root,
               [nodes.Output, [nodes.TemplateData, 'hello ']],
               [nodes.Output, [nodes.Symbol, 'foo']]]);
    });
});