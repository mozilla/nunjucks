
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

    nextToken: function (withWhitespace) {
        var tok;

        if(this.peeked) {
            if(!withWhitespace && this.peeked.type == lexer.TOKEN_WHITESPACE) {
                this.peeked = null;
            }
            else {
                tok = this.peeked;
                this.peeked = null;
                return tok;
            }
        }

        tok = this.tokens.nextToken();

        if(!withWhitespace) {
            while(tok && tok.type == lexer.TOKEN_WHITESPACE) {
                tok = this.tokens.nextToken();
            }
        }
        
        return tok;
    },

    peekToken: function () {
        this.peeked = this.peeked || this.nextToken();
        return this.peeked;
    },

    pushToken: function(tok) {
        if(this.peeked) {
            throw new Error("pushToken: can only push one token on between reads");
        }
        this.peeked = tok;
    },

    fail: function (msg, lineno, colno) {
        if((!lineno || !colno) && this.peekToken()) {
            var tok = this.peekToken();
            lineno = tok.lineno;
            colno = tok.colno;
        }

        if(lineno && colno) {
            msg = '[' + lineno + ',' + colno + '] ' + msg;
        }

        throw new Error(msg);
    },

    skip: function(type) {
        var tok = this.nextToken();
        if(!tok || tok.type != type) {
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

        if(!this.skip(lexer.TOKEN_BLOCK_END)) {
            this.fail("expected block end in " + name + " statement");
        }
    },

    advanceAfterVariableEnd: function() {
        if(!this.skip(lexer.TOKEN_VARIABLE_END)) {
            this.fail("expected variable end");
        }
    },

    parseFor: function() {
        var forTok = this.peekToken();
        if(!this.skipSymbol('for')) {
            this.fail("parseFor: expected for");
        }

        var node = new nodes.For(forTok.lineno, forTok.colno);
        
        node.name = this.parseExpression();

        if(!node.name instanceof nodes.Symbol) {
            this.fail('variable name expected');
        }

        if(!this.skipSymbol('in')) {
            this.fail('expected "in" keyword');
        }

        node.arr = this.parseExpression();
        this.advanceAfterBlockEnd(forTok.value);

        node.body = this.parseUntilBlocks('endfor');
        this.advanceAfterBlockEnd();

        return node;
    },

    parseBlock: function() {
        var tag = this.peekToken();
        if(!this.skipSymbol('block')) {
            throw new Error('parseBlock: expected block');
        }

        var node = new nodes.Block(tag.lineno, tag.colno);

        node.name = this.parseExpression();
        if(!node.name instanceof nodes.Symbol) {
            this.fail('variable name expected');
        }

        this.advanceAfterBlockEnd(tag.value);

        node.body = this.parseUntilBlocks('endblock');
        this.advanceAfterBlockEnd();

        return node;
    },

    parseExtends: function() {
        var tag = this.peekToken();
        if(!this.skipSymbol('extends')) {
            throw new Error('parseBlock: expected block');
        }

        var node = new nodes.Extends(tag.lineno, tag.colno);

        node.template = this.parseExpression();
        if(!(node.template instanceof nodes.Literal &&
             _.isString(node.template.value))) {
            this.fail('parseExtends: string expected');
        }

        this.advanceAfterBlockEnd(tag.value);
        return node;
    },

    parseIf: function() {
        var tag = this.peekToken();
        if(!this.skipSymbol('if') && !this.skipSymbol('elif')) {
            throw new Error("parseIf: expected if or elif");
        }

        var node = new nodes.If(tag.lineno, tag.colno);

        node.cond = this.parseExpression();
        this.advanceAfterBlockEnd(tag.value);

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
            case 'raw': node = this.parseRaw(); break;
            case 'if': node = this.parseIf(); break;
            case 'for': node = this.parseFor(); break;
            case 'block': node = this.parseBlock(); break;
            case 'extends': node = this.parseExtends(); break;
            default: this.fail('unknown block tag: ' + tok.value);
        }

        return node;
    },

    parseRaw: function() {
        this.advanceAfterBlockEnd();
        var str = '';
        var begun = this.peekToken();

        while(1) {
            // Passing true gives us all the whitespace tokens as
            // well, which are usually ignored.
            var tok = this.nextToken(true);

            if(!tok) {
                this.fail("expected endraw, got end of file");
            }

            if(tok.type == lexer.TOKEN_BLOCK_START) {
                // We need to look for the `endraw` block statement,
                // which involves a lookahead so carefully keep track
                // of whitespace
                var ws = null;
                var name = this.nextToken(true);

                if(name.type == lexer.TOKEN_WHITESPACE) {
                    ws = name;
                    name = this.nextToken();
                }

                if(name.type == lexer.TOKEN_SYMBOL &&
                   name.value == 'endraw') {
                    this.advanceAfterBlockEnd(name.value);
                    break;
                }
                else {
                    str += tok.value;
                    if(ws) {
                        str += ws.value;
                    }
                    str += name.value;
                }
            }
            else {
                str += tok.value;
            }
        }

        return new nodes.TemplateData(begun.lineno, begun.colno, str);
    },

    parseExpression: function (no_filters) {
        var tok = this.nextToken();
        var val = null;
        var node = null;
        
        // HACK: until we get operators working, allow negatives
        var negate = false;
        if(tok && 
           tok.type == lexer.TOKEN_OPERATOR &&
           tok.value == '-' &&
           (this.peekToken().type == lexer.TOKEN_INT ||
            this.peekToken().type == lexer.TOKEN_FLOAT)) {
            negate = true;
            tok = this.nextToken();
        }

        if(!tok) {
            this.fail('expected expression, got end of file');
        }
        else if(tok.type == lexer.TOKEN_STRING) {
            val = tok.value;
        }
        else if(tok.type == lexer.TOKEN_INT) {
            val = parseInt(tok.value, 10);
            if(negate) {
                val = -val;
            }
        }
        else if(tok.type == lexer.TOKEN_FLOAT) {
            val = parseFloat(tok.value);
            if(negate) {
                val = -val;
            }
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

            tok = this.peekToken();

            if(tok && tok.type == lexer.TOKEN_LEFT_PAREN) {
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
                    tok = this.peekToken();

                    if(!tok || tok.type != lexer.TOKEN_PIPE) {
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
            }

            if(node instanceof nodes.Dict) {
                // TODO: check for errors
                var key = this.parseExpression();

                // We expect a key/value pair for dicts, separated by a
                // colon
                if(!this.skip(lexer.TOKEN_COLON)) {
                    throw new Error("parseAggregate: expected colon after dict key");
                }

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

    parseNodes: function () {
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
            else if(tok.type != lexer.TOKEN_COMMENT) {
                // Ignore comments, otherwise this should be an error
                throw new Error("Unexpected token at top-level: " +
                                tok.type);
            }
        }

        return buf;
    },

    parse: function() {
        return new nodes.NodeList(0, 0, this.parseNodes());
    },

    parseAsRoot: function() {
        return new nodes.Root(0, 0, this.parseNodes());
    }
});

// var util = require('util');

// console.log('sdfd\\"sdfd');
// var l = lexer.lex('1 2 3 {{ "h\\"ello" }} 4');
// var t;
// while((t = l.nextToken())) {
//     console.log(util.inspect(t));
// }

// var p = new Parser(lexer.lex('{% extends "hello.html" %} {% block content %}hello {{ user }}{% endblock %}'));
// var n = p.parse();
// nodes.printNodes(n);

module.exports = {
    parse: function(src) {
        var p = new Parser(lexer.lex(src));
        return p.parseAsRoot();
    }
};
