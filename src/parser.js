
// Does not support:
//
// Conditional expression: "yes" if True else "no"

var lexer = require('./lexer');
var nodes = require('./nodes');
var Object = require('./object');
var _ = require('underscore');

var Parser = Object.extend({
    init: function (tokens) {
        this.tokens = tokens;
        this.peeked = null;
        this.breakOnBlocks = null;
    },

    nextToken: function () {
        if(this.peeked) {
            var tok = this.peeked;
            this.peeked = null;
            return tok;
        }
        return this.tokens.nextToken();
    },

    peekToken: function () {
        if(this.peeked) {
            return this.peeked;
        }

        var tok = this.tokens.nextToken();
        this.peeked = tok;
        return tok;
    },

    pushToken: function(tok) {
        if(this.peeked) {
            throw new Error("pushToken: can only push one token on between reads");
        }
        this.peeked = tok;
    },

    fail: function (msg, lineno, colno) {
        if(!lineno || !colno) {
            var tok = this.peekToken();
            lineno = tok.lineno;
            colno = tok.colno;
        }

        throw new Error('[' + lineno + ',' + colno + '] ' + msg);
    },

    skip: function(type) {
        var tok = this.nextToken();
        if(tok.type != type) {
            this.pushToken(tok);
            return false;
        }
        return true;
    },

    skipWhitespace: function () {
        return this.skip(lexer.TOKEN_WHITESPACE);
    },

    skipSymbol: function(name) {
        var tok = this.nextToken();
        if(tok.type != lexer.TOKEN_SYMBOL ||
           tok.value != name) {
            this.pushToken(tok);
            return false;
        }
        return true;
    },

    advanceAfterBlockEnd: function(name) {
        if(!name) {
            if(this.peekToken().type != lexer.TOKEN_SYMBOL) {
                this.fail("advanceAfterBlockEnd: expected symbol token or " +
                          "explicit name to be passed");
            }
            name = this.nextToken().value;
        }

        this.skipWhitespace();

        if(!this.skip(lexer.TOKEN_BLOCK_END)) {
            this.fail("expected block end in " + name + " statement");
        }
    },

    advanceAfterVariableEnd: function() {
        this.skipWhitespace();

        if(!this.skip(lexer.TOKEN_VARIABLE_END)) {
            this.fail("expected variable end");
        }
    },

    parseFor: function() {

    },

    parseIf: function() {
        var iftok = this.peekToken();
        if(!this.skipSymbol('if') && !this.skipSymbol('elif')) {
            throw new Error("parseIf: expected if or elif");
        }

        var node = new nodes.If(iftok.lineno, iftok.colno);

        this.skipWhitespace();
        node.cond = this.parseExpression();
        this.advanceAfterBlockEnd(iftok.value);

        node.body = this.parseUntilBlocks('elif', 'else', 'endif');
        var tok = this.peekToken();

        switch(tok.value) {
        case "elif":
            node.else_ = this.parseIf();
            break;
        case "else":
            this.advanceAfterBlockEnd();
            node.else_ = this.parseUntilBlocks("endif");
            this.advanceAfterBlockEnd();
            break;
        case "endif":
            node.else_ = null;
            this.advanceAfterBlockEnd();
            break;
        }

        return node;
    },

    parseStatement: function () {
        this.skipWhitespace();

        var tok = this.peekToken();
        var node;

        if(tok.type != lexer.TOKEN_SYMBOL) {
            this.fail('tag name expected', tok.lineno, tok.colno);
        }

        if(this.breakOnBlocks &&
           _.indexOf(this.breakOnBlocks, tok.value) != -1) {
            return null;
        }

        switch(tok.value) {
            case 'if': node = this.parseIf(); break;
            //case 'for': node = this.parseFor(); break;
            // case 'block': parseBlock();
            // case 'extends': parseExtends();
            default:
        }

        return node;
    },

    parseExpression: function (no_filters) {
        this.skipWhitespace();
        var tok = this.nextToken();
        var val = null;
        var node = null;

        if(tok.type == lexer.TOKEN_STRING) {
            val = tok.value;
        }
        else if(tok.type == lexer.TOKEN_INT) {
            val = parseInt(tok.value, 10);
        }
        else if(tok.type == lexer.TOKEN_FLOAT) {
            val = parseFloat(tok.value);
        }
        else if(tok.type == lexer.TOKEN_BOOLEAN) {
            if(tok.value == "true") {
                val = true;
            }
            else if(tok.value == "false") {
                val = false;
            }
            else {
                this.fail("invalid boolean: " + tok.val,
                          tok.lineno,
                          tok.colno);
            }
        }

        if(val !== null) {
            node = new nodes.Literal(tok.lineno, tok.colno, val);
        }
        else if(tok.type == lexer.TOKEN_SYMBOL) {
            node = new nodes.Symbol(tok.lineno, tok.colno, tok.value);

            this.skipWhitespace();
            tok = this.peekToken();

            if(tok.type == lexer.TOKEN_LEFT_PAREN) {
                // Function call
                var list = this.parseAggregate();
                node = new nodes.FunCall(tok.lineno,
                                         tok.colno,
                                         node,
                                         list.children);
            }
        }
        else {
            // See if it's an aggregate type, we need to push the
            // current delimiter token back on
            this.pushToken(tok);
            node = this.parseAggregate();
        }

        if(node) {
            if(!no_filters) {
                while(1) {
                    // Check for filters
                    this.skipWhitespace();
                    tok = this.peekToken();

                    if(tok.type != lexer.TOKEN_PIPE) {
                        break;
                    }

                    node = this.parseFilter(node);
                }
            }

            return node;
        }
        else {
            throw new Error("parseExpression: invalid token: " + tok.type);
        }
    },

    parseFilter: function(node) {
        if(this.nextToken().type != lexer.TOKEN_PIPE) {
            this.fail("parseFilter: expected pipe");
        }

        var filter = this.parseExpression(true);

        if(filter instanceof nodes.Symbol) {
            filter = new nodes.Filter(filter.lineno,
                                      filter.colno,
                                      filter,
                                      [node]);
        }
        else if(filter instanceof nodes.FunCall) {
            filter = new nodes.Filter(filter.lineno,
                                      filter.colno,
                                      filter.name,
                                      [node].concat(filter.children));
        }
        else {
            this.fail("a filter must be a name or a function call",
                      filter.lineno,
                      filter.colno);
        }

        return filter;
    },

    parseAggregate: function() {
        this.skipWhitespace();
        var tok = this.nextToken();
        var node;

        switch(tok.type) {
        case lexer.TOKEN_LEFT_PAREN:
            node = new nodes.Group(tok.lineno, tok.colno); break;
        case lexer.TOKEN_LEFT_BRACKET:
            node = new nodes.Array(tok.lineno, tok.colno); break;
        case lexer.TOKEN_LEFT_CURLY:
            node = new nodes.Dict(tok.lineno, tok.colno); break;
        default:
            return null;
        }

        while(1) {
            this.skipWhitespace();

            var type = this.peekToken().type;
            if(type == lexer.TOKEN_RIGHT_PAREN ||
               type == lexer.TOKEN_RIGHT_BRACKET ||
               type == lexer.TOKEN_RIGHT_CURLY) {
                this.nextToken();
                break;
            }

            if(node.numChildren() > 0) {
                if(!this.skip(lexer.TOKEN_COMMA)) {
                    throw new Error("parseAggregate: expected comma after expression");
                }
                this.skipWhitespace();
            }

            if(node instanceof nodes.Dict) {
                // TODO: check for errors
                var key = this.parseExpression();

                // We expect a key/value pair for dicts, separated by a
                // colon
                this.skipWhitespace();
                if(!this.skip(lexer.TOKEN_COLON)) {
                    throw new Error("parseAggregate: expected colon after dict key");
                }
                this.skipWhitespace();

                // TODO: check for errors
                var value = this.parseExpression();
                node.addChild(new nodes.Pair(key.lineno,
                                             key.colno,
                                             key,
                                             value));
            }
            else {
                // TODO: check for errors
                var expr = this.parseExpression();
                node.addChild(expr);
            }
        }

        return node;
    },

    parseUntilBlocks: function(/* blockNames */) {
        var prev = this.breakOnBlocks;
        this.breakOnBlocks = _.toArray(arguments);

        var ret = this.parse();

        this.breakOnBlocks = prev;
        return ret;
    },

    parse: function () {
        var tok;
        var buf = [];

        while((tok = this.nextToken())) {
            if(tok.type == lexer.TOKEN_DATA) {
                buf.push(new nodes.Output(tok.lineno,
                                          tok.colno,
                                          [new nodes.TemplateData(tok.lineno,
                                                                  tok.colno,
                                                                  tok.value)]));
            }
            else if(tok.type == lexer.TOKEN_BLOCK_START) {
                var n = this.parseStatement();
                if(!n) {
                    break;
                }
                buf.push(n);
            }
            else if(tok.type == lexer.TOKEN_VARIABLE_START) {
                var e = this.parseExpression();
                this.advanceAfterVariableEnd();
                buf.push(new nodes.Output(tok.lineno, tok.colno, [e]));
            }
            else {
                // Most likely, if there's whitespace we're really
                // interested in the next token
                this.skipWhitespace();
                throw new Error("Unexpected token at top-level: " +
                                this.peekToken().type);
            }
        }

        return new nodes.NodeList(0, 0, buf);
    }
});

// var util = require('util');

// console.log('sdfd\\"sdfd');
// var l = lexer.lex('1 2 3 {{ "h\\"ello" }} 4');
// var t;
// while((t = l.nextToken())) {
//     console.log(util.inspect(t));
// }

// var p = new Parser(lexer.lex("1 {{ one }} 2"));
// var n = p.parse();
// nodes.printNodes(n);

module.exports = {
    parse: function(src) {
        var p = new Parser(lexer.lex(src));
        return p.parse();
    }
};
