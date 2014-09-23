(function() {
    var expect, lib, lexer;

    if(typeof require != 'undefined') {
        expect = require('expect.js');
        lib = require('../src/lib');
        lexer = require('../src/lexer');
    }
    else {
        expect = window.expect;
        lib = nunjucks.require('lib');
        lexer = nunjucks.require('lexer');
    }

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
                expect(tok.type).to.be(type[0]);
                expect(tok.value).to.be(type[1]);
            }
            else {
                expect(tok.type).to.be(type);
            }
        }
    }

    function hasTokens(tokens /*, types */) {
        return _hasTokens(false, tokens, lib.toArray(arguments).slice(1));
    }

    function hasTokensWithWS(tokens /*, types */) {
        return _hasTokens(true, tokens, lib.toArray(arguments).slice(1));
    }

    describe('lexer', function() {
        var tok, tmpl, tokens;

        it('should parse template data', function() {
            tok = lexer.lex('3').nextToken();
            expect(tok.type).to.be(lexer.TOKEN_DATA);
            expect(tok.value).to.be('3');

            tmpl = 'foo bar bizzle 3 [1,2] !@#$%^&*()<>?:"{}|';
            tok = lexer.lex(tmpl).nextToken();
            expect(tok.type).to.be(lexer.TOKEN_DATA);
            expect(tok.value).to.be(tmpl);
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
            tokens = lexer.lex('{{ 3 4.5 true false foo "hello" \'boo\' r/regex/ }}');
            hasTokens(tokens,
                      lexer.TOKEN_VARIABLE_START,
                      lexer.TOKEN_INT,
                      lexer.TOKEN_FLOAT,
                      lexer.TOKEN_BOOLEAN,
                      lexer.TOKEN_BOOLEAN,
                      lexer.TOKEN_SYMBOL,
                      lexer.TOKEN_STRING,
                      lexer.TOKEN_STRING,
                      lexer.TOKEN_REGEX,
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
        }),

        it('should allow changing the variable start and end', function() {
            tokens = lexer.lex('data {= var =}', {variableStart: '{=', variableEnd: '=}'});
            hasTokens(tokens,
                      lexer.TOKEN_DATA,
                      lexer.TOKEN_VARIABLE_START,
                      lexer.TOKEN_SYMBOL,
                      lexer.TOKEN_VARIABLE_END);
        }),

        it('should allow changing the block start and end', function() {
            tokens = lexer.lex('{= =}', {blockStart: '{=', blockEnd: '=}'});
            hasTokens(tokens,
                      lexer.TOKEN_BLOCK_START,
                      lexer.TOKEN_BLOCK_END);
        }),

        it('should allow changing the variable start and end', function() {
            tokens = lexer.lex('data {= var =}', {variableStart: '{=', variableEnd: '=}'});
            hasTokens(tokens,
                      lexer.TOKEN_DATA,
                      lexer.TOKEN_VARIABLE_START,
                      lexer.TOKEN_SYMBOL,
                      lexer.TOKEN_VARIABLE_END);
        }),

        it('should allow changing the comment start and end', function() {
            tokens = lexer.lex('<!-- A comment! -->', {commentStart: '<!--', commentEnd: '-->'});
            hasTokens(tokens,
                      lexer.TOKEN_COMMENT);
        }),

        /**
         * Test that this bug is fixed: https://github.com/mozilla/nunjucks/issues/235
         */
        it('should have individual lexer tag settings for each environment', function() {
            tokens = lexer.lex('{=', {variableStart: '{='});
            hasTokens(tokens, lexer.TOKEN_VARIABLE_START);

            tokens = lexer.lex('{{');
            hasTokens(tokens, lexer.TOKEN_VARIABLE_START);

            tokens = lexer.lex('{{', {variableStart: '<<<'});
            hasTokens(tokens, lexer.TOKEN_DATA);

            tokens = lexer.lex('{{');
            hasTokens(tokens, lexer.TOKEN_VARIABLE_START);
        });

        it('should parse regular expressions', function() {
            tokens = lexer.lex('{{ r/basic regex [a-z]/ }}');
            hasTokens(tokens,
                      lexer.TOKEN_VARIABLE_START,
                      lexer.TOKEN_REGEX,
                      lexer.TOKEN_VARIABLE_END);

            // A more complex regex with escaped slashes.
            tokens = lexer.lex('{{ r/{a*b} \\/regex! [0-9]\\// }}');
            hasTokens(tokens,
                      lexer.TOKEN_VARIABLE_START,
                      lexer.TOKEN_REGEX,
                      lexer.TOKEN_VARIABLE_END);

            // This one has flags.
            tokens = lexer.lex('{{ r/^x/gim }}');
            hasTokens(tokens,
                      lexer.TOKEN_VARIABLE_START,
                      lexer.TOKEN_REGEX,
                      lexer.TOKEN_VARIABLE_END);

            // This one has a valid flag then an invalid flag.
            tokens = lexer.lex('{{ r/x$/iv }}');
            hasTokens(tokens,
                      lexer.TOKEN_VARIABLE_START,
                      lexer.TOKEN_REGEX,
                      lexer.TOKEN_SYMBOL,
                      lexer.TOKEN_VARIABLE_END);
        });
    });
})();
