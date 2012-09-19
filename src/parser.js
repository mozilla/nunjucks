
// Does not support:
//
// Conditional expression: "yes" if True else "no"

var lexer = require('./lexer');
var nodes = require('./nodes');
var Object = require('./object');
var lib = require('./lib');

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
            msg = '[Line ' + (lineno + 1) + ', Column ' + (colno + 1) + '] ' + msg;
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

    expect: function(type) {
        var tok = this.nextToken();
        if(!tok.type == type) {
            this.fail('expected ' + type + ', got ' + tok.type,
                      tok.lineno,
                      tok.colno);
        }
        return tok;
    },

    skipValue: function(type, val) {
        var tok = this.nextToken();
        if(!tok || tok.type != type || tok.value != val) {
            this.pushToken(tok);
            return false;
        }
        return true;
    },

    skipWhitespace: function () {
        return this.skip(lexer.TOKEN_WHITESPACE);
    },

    skipSymbol: function(val) {
        return this.skipValue(lexer.TOKEN_SYMBOL, val);
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
            this.fail("expected for");
        }

        var node = new nodes.For(forTok.lineno, forTok.colno);

        node.name = this.parsePrimary();

        if(!node.name instanceof nodes.Symbol) {
            this.fail('variable name expected');
        }

        if(this.skip(lexer.TOKEN_COMMA)) {
            // key/value iteration
            var key = node.name;
            node.name = new nodes.Array(key.lineno, key.colno);
            node.name.addChild(key);
            node.name.addChild(this.parsePrimary());
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
            this.fail('expected block');
        }

        var node = new nodes.Block(tag.lineno, tag.colno);

        node.name = this.parsePrimary();
        if(!node.name instanceof nodes.Symbol) {
            this.fail('variable name expected');
        }

        this.advanceAfterBlockEnd(tag.value);

        node.body = this.parseUntilBlocks('endblock');

        if(!this.peekToken()) {
            this.fail('expected endblock, got end of file');
        }

        this.advanceAfterBlockEnd();

        return node;
    },

    parseTemplateRef: function(tagName, nodeType) {
        var tag = this.peekToken();
        if(!this.skipSymbol(tagName)) {
            this.fail('expected '+ tagName);
        }

        var node = new nodeType(tag.lineno, tag.colno);

        node.template = this.parsePrimary();
        if(!(node.template instanceof nodes.Literal &&
             lib.isString(node.template.value))) {
            this.fail('parseExtends: string expected');
        }

        this.advanceAfterBlockEnd(tag.value);
        return node;
    },

    parseExtends: function() {
        return this.parseTemplateRef('extends', nodes.Extends);
    },

    parseInclude: function() {
        return this.parseTemplateRef('include', nodes.Include);
    },

    parseIf: function() {
        var tag = this.peekToken();
        if(!this.skipSymbol('if') && !this.skipSymbol('elif')) {
            this.fail("expected if or elif");
        }

        var node = new nodes.If(tag.lineno, tag.colno);

        node.cond = this.parseExpression();
        this.advanceAfterBlockEnd(tag.value);

        node.body = this.parseUntilBlocks('elif', 'else', 'endif');
        var tok = this.peekToken();

        switch(tok && tok.value) {
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
        default:
            this.fail('expected endif, else, or endif, got end of file');
        }

        return node;
    },

    parseSet: function() {
        var tag = this.peekToken();
        if(!this.skipSymbol('set')) {
            this.fail('expected set');
        }

        var node = new nodes.Set(tag.lineno, tag.colno);
        node.targets = [];

        var target;
        while((target = this.parsePrimary())) {
            node.targets.push(target);

            if(!this.skip(lexer.TOKEN_COMMA)) {
                break;
            }
        }

        if(!this.skipValue(lexer.TOKEN_OPERATOR, '=')) {
            this.fail('expected = in set tag');
        }

        node.value = this.parseExpression();
        this.advanceAfterBlockEnd(tag.value);

        return node;
    },

    parseStatement: function () {
        var tok = this.peekToken();
        var node;

        if(tok.type != lexer.TOKEN_SYMBOL) {
            this.fail('tag name expected', tok.lineno, tok.colno);
        }

        if(this.breakOnBlocks &&
           this.breakOnBlocks.indexOf(tok.value) != -1) {
            return null;
        }

        switch(tok.value) {
            case 'raw': node = this.parseRaw(); break;
            case 'if': node = this.parseIf(); break;
            case 'for': node = this.parseFor(); break;
            case 'block': node = this.parseBlock(); break;
            case 'extends': node = this.parseExtends(); break;
            case 'include': node = this.parseInclude(); break;
            case 'set': node = this.parseSet(); break;
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

    parsePostfix: function(node) {
        var tok = this.peekToken();

        while(tok) {
            if(tok.type == lexer.TOKEN_LEFT_PAREN) {
                // Function call
                var list = this.parseAggregate();
                node =  new nodes.FunCall(tok.lineno,
                                          tok.colno,
                                          node,
                                          list.children);
            }
            else if(tok.type == lexer.TOKEN_LEFT_BRACKET) {
                // Reference
                var lookup = this.parseAggregate();
                if(lookup.children.length > 1) {
                    this.fail('invalid index');
                }

                node =  new nodes.LookupVal(tok.lineno,
                                            tok.colno,
                                            node,
                                            lookup.children[0]);
            }
            else if(tok.type == lexer.TOKEN_OPERATOR && tok.value == '.') {
                // Reference
                this.nextToken();
                var val = this.nextToken();

                if(val.type != lexer.TOKEN_SYMBOL) {
                    this.fail('expected name as lookup value, got ' + val.value);
                }

                // Make a literal string because it's not a variable
                // reference
                var lookup = new nodes.Literal(val.lineno,
                                               val.colno,
                                               val.value);

                node =  new nodes.LookupVal(tok.lineno,
                                            tok.colno,
                                            node,
                                            lookup);
            }
            else {
                break;
            }

            tok = this.peekToken();
        }

        return node;
    },

    parseExpression: function() {
        var node = this.parseOr();
        return node;
    },

    parseOr: function() {
        var node = this.parseAnd();
        while(this.skipSymbol('or')) {
            var node2 = this.parseAnd();
            node = new nodes.Or(node.lineno,
                                node.colno,
                                node,
                                node2);
        }
        return node;
    },

    parseAnd: function() {
        var node = this.parseNot();
        while(this.skipSymbol('and')) {
            var node2 = this.parseNot();
            node = new nodes.And(node.lineno,
                                 node.colno,
                                 node,
                                 node2);
        }
        return node;
    },

    parseNot: function() {
        var tok = this.peekToken();
        if(this.skipSymbol('not')) {
            return new nodes.Not(tok.lineno,
                                 tok.colno,
                                 this.parseNot());
        }
        return this.parseCompare();
    },

    parseCompare: function() {
        var compareOps = ['==', '!=', '<', '>', '<=', '>='];
        var expr = this.parseAdd();
        var ops = [];

        while(1) {
            var tok = this.nextToken();

            if(!tok) {
                break;
            }
            else if(compareOps.indexOf(tok.value) != -1) {
                ops.push(new nodes.CompareOperand(tok.lineno,
                                                  tok.colno,
                                                  this.parseAdd(),
                                                  tok.value));
            }
            else if(tok.type == lexer.TOKEN_SYMBOL &&
                    tok.value == 'in') {
                ops.push(new nodes.CompareOperand(tok.lineno,
                                                  tok.colno,
                                                  this.parseAdd(),
                                                  'in'));
            }
            else if(tok.type == lexer.TOKEN_SYMBOL &&
                    tok.value == 'not' &&
                    this.skipSymbol('in')) {
                ops.push(new nodes.CompareOperand(tok.lineno,
                                                  tok.colno,
                                                  this.parseAdd(),
                                                  'notin'));
            }
            else {
                this.pushToken(tok);
                break;
            }
        }

        if(ops.length) {
            return new nodes.Compare(ops[0].lineno,
                                     ops[0].colno,
                                     expr,
                                     ops);
        }
        else {
            return expr;
        }
    },

    parseAdd: function() {
        var node = this.parseSub();
        while(this.skipValue(lexer.TOKEN_OPERATOR, '+')) {
            var node2 = this.parseSub();
            node = new nodes.Add(node.lineno,
                                 node.colno,
                                 node,
                                 node2);
        }
        return node;
    },

    parseSub: function() {
        var node = this.parseMul();
        while(this.skipValue(lexer.TOKEN_OPERATOR, '-')) {
            var node2 = this.parseMul();
            node = new nodes.Sub(node.lineno,
                                 node.colno,
                                 node,
                                 node2);
        }
        return node;
    },

    parseMul: function() {
        var node = this.parseDiv();
        while(this.skipValue(lexer.TOKEN_OPERATOR, '*')) {
            var node2 = this.parseDiv();
            node = new nodes.Mul(node.lineno,
                                 node.colno,
                                 node,
                                 node2);
        }
        return node;
    },

    parseDiv: function() {
        var node = this.parseFloorDiv();
        while(this.skipValue(lexer.TOKEN_OPERATOR, '/')) {
            var node2 = this.parseFloorDiv();
            node = new nodes.Div(node.lineno,
                                 node.colno,
                                 node,
                                 node2);
        }
        return node;
    },

    parseFloorDiv: function() {
        var node = this.parseMod();
        while(this.skipValue(lexer.TOKEN_OPERATOR, '//')) {
            var node2 = this.parseMod();
            node = new nodes.FloorDiv(node.lineno,
                                      node.colno,
                                      node,
                                      node2);
        }
        return node;
    },

    parseMod: function() {
        var node = this.parsePow();
        while(this.skipValue(lexer.TOKEN_OPERATOR, '%')) {
            var node2 = this.parsePow();
            node = new nodes.Mod(node.lineno,
                                 node.colno,
                                 node,
                                 node2);
        }
        return node;
    },

    parsePow: function() {
        var node = this.parseUnary();
        while(this.skipValue(lexer.TOKEN_OPERATOR, '**')) {
            var node2 = this.parseUnary();
            node = new nodes.Pow(node.lineno,
                                 node.colno,
                                 node,
                                 node2);
        }
        return node;
    },

    parseUnary: function(noFilters) {
        var tok = this.peekToken();
        var node;

        if(this.skipValue(lexer.TOKEN_OPERATOR, '-')) {
            node = new nodes.Neg(tok.lineno,
                                 tok.colno,
                                 this.parseUnary(true));
        }
        else if(this.skipValue(lexer.TOKEN_OPERATOR, '+')) {
            node = new nodes.Pos(tok.lineno,
                                 tok.colno,
                                 this.parseUnary(true));
        }
        else {
            node = this.parsePrimary();
        }

        if(!noFilters) {
            node = this.parseFilter(node);
        }

        return node;
    },

    parsePrimary: function () {
        var tok = this.nextToken();
        var val = null;
        var node = null;

        if(!tok) {
            this.fail('expected expression, got end of file');
        }
        else if(tok.type == lexer.TOKEN_STRING) {
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
            node = this.parsePostfix(node);
        }
        else {
            // See if it's an aggregate type, we need to push the
            // current delimiter token back on
            this.pushToken(tok);
            node = this.parseAggregate();
        }

        if(node) {
            return node;
        }
        else {
            this.fail('unexpected token: ' + tok.value,
                      tok.lineno,
                      tok.colno);
        }
    },

    parseFilter: function(node) {
        while(this.skip(lexer.TOKEN_PIPE)) {
            var tok = this.expect(lexer.TOKEN_SYMBOL);
            var name = tok.value;

            while(this.skipValue(lexer.TOKEN_OPERATOR, '.')) {
                name += '.' + this.expect(lexer.TOKEN_SYMBOL).value;
            }

            node = new nodes.Filter(tok.lineno,
                                    tok.colno,
                                    new nodes.Symbol(tok.lineno,
                                                     tok.colno,
                                                     name),
                                    [node]);

            if(this.peekToken().type == lexer.TOKEN_LEFT_PAREN) {
                // Get a FunCall node and add the parameters to the
                // filter
                var call = this.parsePostfix(node);
                node.children = node.children.concat(call.children);
            }
        }

        return node;
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
                var key = this.parsePrimary();

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
        this.breakOnBlocks = lib.toArray(arguments);

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

var util = require('util');

// var l = lexer.lex('{% set x = 3 %}');
// var t;
// while((t = l.nextToken())) {
//     console.log(util.inspect(t));
// }

// var p = new Parser(lexer.lex('{% set x, y = 3 %}'));
// var n = p.parse();
// nodes.printNodes(n);

module.exports = {
    parse: function(src) {
        var p = new Parser(lexer.lex(src));
        return p.parseAsRoot();
    }
};
