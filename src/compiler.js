
var _ = require('underscore');
var parser = require('./parser');
var nodes = require('./nodes');
var Object = require('./object');

var Compiler = Object.extend({
    init: function() {
        this.codebuf = [];
    },

    emit: function(code) {
        this.codebuf.push(code);
    },

    emitLine: function(code) {
        this.emit(code + "\n");
    },

    _compileChildren: function(node) {
        var _this = this;
        node.iterChildren(function(n) {
            _this.compile(n);
        });        
    },

    _compileAggregate: function(node, startChar, endChar) {
        this.emit(startChar);

        for(var i=0; i<node.children.length; i++) {
            if(i > 0) {
                this.emit(',');
            }

            this.compile(node.children[i]);
        }

        this.emit(endChar);
    },

    _compileExpression: function(node) {
        this.assertType(node,
                        nodes.Literal,
                        nodes.Symbol,
                        nodes.Group,
                        nodes.Array,
                        nodes.Dict,
                        nodes.FunCall,
                        nodes.Filter);
        this.compile(node);
    },

    assertType: function(node /*, types */) {
        var types = _.toArray(arguments).slice(1);
        var success = false;
        
        _.each(types, function(type) {
            if(node instanceof type) {
                success = true;
            }
        });

        if(!success) {
            throw new Error("invalid type: " + node.typename);
        }
    },

    compileNodeList: function(node) {
        this._compileChildren(node);
    },

    compileLiteral: function(node) {
        if(typeof node.value == "string") {
            var val = node.value.replace(/"/g, '\\"');
            val = val.replace(/\n/g, "\\n");
            val = val.replace(/\r/g, "\\r");
            val = val.replace(/\t/g, "\\t");
            this.emit('"' + val  + '"');
        }
        else {
            this.emit(node.value.toString());
        }
    },

    compileSymbol: function(node) {
        this.emit('context.lookup("' + node.value + '")');
    },

    compileGroup: function(node) {
        this._compileAggregate(node, '(', ')');
    },

    compileArray: function(node) {
        this._compileAggregate(node, '[', ']');
    },

    compileDict: function(node) {
        this._compileAggregate(node, '{', '}');
    },

    compilePair: function(node) {
        var key = node.getKey();
        var val = node.getValue();

        if(key instanceof nodes.Symbol) {
            key = new nodes.Literal(key.lineno, key.colno, key.value);
        }
        else if(!(key instanceof nodes.Literal &&
                  typeof node.value == "string")) {
            throw new Error("Dict keys must be strings or names");
        }

        this.compile(key);
        this.emit(': ');
        this._compileExpression(val);
    },

    compileFunCall: function(node) {
        this._compileExpression(node.name);
        this._compileAggregate(node, '(', ')');
    },

    compileFilter: function(node) {
        var name = node.name;
        this.assertType(name, nodes.Symbol);

        this.emit('env.get_filter("' + name.value + '")');
        this._compileAggregate(node, '(', ')');
    },

    compileIf: function(node) {
        this.emit('if(');
        this._compileExpression(node.cond);
        this.emitLine(') {');
        this.compile(node.body);

        if(node.else_) {
            this.emitLine('}\nelse {');
            this.compile(node.else_);
        }

        this.emitLine('}');
    },

    compileTemplateData: function(node) {
        this.compileLiteral(node);
    },

    compileOutput: function(node) {
        this.emit('output += ');
        this._compileChildren(node);
        this.emit(';\n');
    },

    compileRoot: function(node) {
        this.emitLine('(function (env, context) {');
        this.emitLine('var output = "";');
        this._compileChildren(node);
        this.emitLine('return output;');
        this.emitLine('})');
    },

    compile: function (node) {
        var _compile = this["compile" + node.typename];
        if(_compile) {
            _compile.call(this, node);
        }
        else {
            throw new Error("Cannot compile node: " + node.typename);
        }
    },

    getCode: function() {
        return this.codebuf.join("");
    }
});

// var fs = require("fs");
// var c = new Compiler();
// var src = fs.readFileSync("test.html", "utf-8");
// c.compile(parser.parse(src));

// var tmpl = c.getCode();

// console.log(tmpl);

// console.log(render(tmpl, { username: "James Long",
//                            sick: true,
//                            throwing: false,
//                            pooping: false }));

module.exports = {
    compile: function(src) {
        var c = new Compiler();
        c.compile(parser.parse(src));
        return c.getCode();
    },

    Compiler: Compiler
};

/*
 * This template:
 *
 * Hello {{ username }}
 *
 * Should be turned into:
 *
 * function root(env) {
 *   var l_username = ctx.resolve("username");
 *   return "Hello " + l_username;
 * }
 *
 *
 *
 *
 */