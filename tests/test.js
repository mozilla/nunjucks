
var should = require('should');
var _ = require('underscore');
var lexer = require('../src/lexer');
var parser = require('../src/parser');
var compiler = require('../src/compiler');

var tok, tmpl, tokens;

function _hasTokens(ws, tokens, types) {
    _.each(types, function(type) {
        tok = tokens.nextToken();

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

describe('lexer', function() {
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
