
var should = require('should');
var _ = require('underscore');
var lexer = require('../src/lexer');
var parser = require('../src/parser');
var compiler = require('../src/compiler');

var tok, tmpl, tokens;

function should_be_tokens(tokens /*, types */) {
    var types = _.toArray(arguments).slice(1);
    _.each(types, function(type) {
        var tok = tokens.nextToken();

        if(_.isArray(type)) {
            tok.type.should.equal(type[0]);
            tok.value.should.equal(type[1]);
        }
        else {
            tok.type.should.equal(type);
        }
    });
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

    it('should parse variable start and end', function() {
        tokens = lexer.lex('data {{ foo }} bar bizzle');
        should_be_tokens(tokens,
                         lexer.TOKEN_DATA,
                         lexer.TOKEN_VARIABLE_START,
                         lexer.TOKEN_WHITESPACE,
                         lexer.TOKEN_SYMBOL,
                         lexer.TOKEN_WHITESPACE,
                         lexer.TOKEN_VARIABLE_END,
                         lexer.TOKEN_DATA);
    });

    it('should parse block start and end', function() {
        tokens = lexer.lex('data {% foo %} bar bizzle');
        should_be_tokens(tokens,
                         lexer.TOKEN_DATA,
                         lexer.TOKEN_BLOCK_START,
                         lexer.TOKEN_WHITESPACE,
                         lexer.TOKEN_SYMBOL,
                         lexer.TOKEN_WHITESPACE,
                         lexer.TOKEN_BLOCK_END,
                         lexer.TOKEN_DATA);
    });

    it('should parse ints', function() {
        tokens = lexer.lex('{{ 3 }}');
        should_be_tokens(tokens,
                         lexer.TOKEN_VARIABLE_START,
                         lexer.TOKEN_WHITESPACE,
                         lexer.TOKEN_INT,
                         lexer.TOKEN_WHITESPACE,
                         lexer.TOKEN_VARIABLE_END);
    }),

    it('should parse function calls', function() {
        tokens = lexer.lex('{{ foo(bar) }}');
        should_be_tokens(tokens,
                         lexer.TOKEN_VARIABLE_START,
                         lexer.TOKEN_WHITESPACE,
                         [lexer.TOKEN_SYMBOL, 'foo'],
                         lexer.TOKEN_LEFT_PAREN,
                         [lexer.TOKEN_SYMBOL, 'bar'],
                         lexer.TOKEN_RIGHT_PAREN,
                         lexer.TOKEN_WHITESPACE,
                         lexer.TOKEN_VARIABLE_END);
    });

    it('should parse arrays', function() {
        tokens = lexer.lex('{{ [1,2,  3] }}');
        should_be_tokens(tokens,
                         lexer.TOKEN_VARIABLE_START,
                         lexer.TOKEN_WHITESPACE,
                         lexer.TOKEN_LEFT_BRACKET,
                         lexer.TOKEN_INT,
                         lexer.TOKEN_COMMA,
                         lexer.TOKEN_INT,
                         lexer.TOKEN_COMMA,
                         lexer.TOKEN_WHITESPACE,
                         lexer.TOKEN_INT,
                         lexer.TOKEN_RIGHT_BRACKET,
                         lexer.TOKEN_WHITESPACE,
                         lexer.TOKEN_VARIABLE_END);
    });

    it('should parse blocks without whitespace', function() {
        tokens = lexer.lex('data{{hello}}{%if%}data');
        should_be_tokens(tokens,
                         lexer.TOKEN_DATA,
                         lexer.TOKEN_VARIABLE_START,
                         [lexer.TOKEN_SYMBOL, 'hello'],
                         lexer.TOKEN_VARIABLE_END,
                         lexer.TOKEN_BLOCK_START,
                         [lexer.TOKEN_SYMBOL, 'if'],
                         lexer.TOKEN_BLOCK_END,
                         lexer.TOKEN_DATA);
    });

    it('should parse comments', function() {
        tokens = lexer.lex('data data {# comment #} data');
        should_be_tokens(tokens,
                         lexer.TOKEN_DATA,
                         lexer.TOKEN_COMMENT,
                         lexer.TOKEN_DATA);
    });
});
