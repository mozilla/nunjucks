
var _ = require('underscore');
var parser = require('./parser');
var nodes = require('./nodes');
var Object = require('./object');

// Frames keep track of scoping at compile-time so we know how to
// access variables. Blocks can introduce special variables, for
// example.
var Frame = Object.extend({
    init: function() {
        this.variables = [];
    },

    add_variable: function(name) {
        this.variables.push(name);
    },

    remove_variable: function(name) {
        this.variables = _.without(this.variables, name);
    },

    find_variable: function(name) {
        return _.indexOf(this.variables, name) !== -1;
    }
});

var Compiler = Object.extend({
    init: function(env) {
        this.codebuf = [];
        this.env = env;
        this.lastId = 0;
    },

    emit: function(code) {
        this.codebuf.push(code);
    },

    emitLine: function(code) {
        this.emit(code + "\n");
    },

    tmpid: function() {
        this.lastId++;
        return 't_' + this.lastId;
    },

    _compileChildren: function(node, frame) {
        var _this = this;
        node.iterChildren(function(n) {
            _this.compile(n, frame);
        });        
    },

    _compileAggregate: function(node, frame, startChar, endChar) {
        this.emit(startChar);

        for(var i=0; i<node.children.length; i++) {
            if(i > 0) {
                this.emit(',');
            }

            this.compile(node.children[i], frame);
        }

        this.emit(endChar);
    },

    _compileExpression: function(node, frame) {
        this.assertType(node,
                        nodes.Literal,
                        nodes.Symbol,
                        nodes.Group,
                        nodes.Array,
                        nodes.Dict,
                        nodes.FunCall,
                        nodes.Filter);
        this.compile(node, frame);
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

    compileNodeList: function(node, frame) {
        this._compileChildren(node, frame);
    },

    compileLiteral: function(node, frame) {
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

    compileSymbol: function(node, frame) {
        var name = node.value;

        if(frame.find_variable(name)) {
            this.emit(name);
        }
        else {
            this.emit('context.lookup("' + name + '")');
        }
    },

    compileGroup: function(node, frame) {
        this._compileAggregate(node, frame, '(', ')');
    },

    compileArray: function(node, frame) {
        this._compileAggregate(node, frame, '[', ']');
    },

    compileDict: function(node, frame) {
        this._compileAggregate(node, frame, '{', '}');
    },

    compilePair: function(node, frame) {
        var key = node.getKey();
        var val = node.getValue();

        if(key instanceof nodes.Symbol) {
            key = new nodes.Literal(key.lineno, key.colno, key.value);
        }
        else if(!(key instanceof nodes.Literal &&
                  typeof node.value == "string")) {
            throw new Error("Dict keys must be strings or names");
        }

        this.compile(key, frame);
        this.emit(': ');
        this._compileExpression(val, frame);
    },

    compileFunCall: function(node, frame) {
        this._compileExpression(node.name, frame);
        this._compileAggregate(node, frame, '(', ')');
    },

    compileFilter: function(node, frame) {
        var name = node.name;
        this.assertType(name, nodes.Symbol);

        this.emit('env.get_filter("' + name.value + '")');
        this._compileAggregate(node, frame, '(', ')');
    },

    compileIf: function(node, frame) {
        this.emit('if(');
        this._compileExpression(node.cond, frame);
        this.emitLine(') {');
        this.compile(node.body, frame);

        if(node.else_) {
            this.emitLine('}\nelse {');
            this.compile(node.else_, frame);
        }

        this.emitLine('}');
    },

    compileFor: function(node, frame) {
        var v = node.name.value;
        var i = this.tmpid();
        var arr = this.tmpid();

        this.emit('var ' + arr + ' = ');
        this._compileExpression(node.arr, frame);
        this.emitLine(';');

        frame.add_variable(v);
        
        this.emitLine('for(var ' + i + '=0; ' + i + ' < ' + arr + '.length; ' +
                      i + '++) {');
        this.emitLine('var ' + v + ' = ' + arr + '[' + i + '];');
        this.compile(node.body, frame);
        this.emitLine('}');

        frame.remove_variable(v);
    },

    compileTemplateData: function(node, frame) {
        this.compileLiteral(node, frame);
    },

    compileOutput: function(node, frame) {
        this.emit('output += ');
        this._compileChildren(node, frame);
        this.emit(';\n');
    },

    compileRoot: function(node, frame) {
        if(frame) {
            throw new Error("root node can't have frame");
        }

        frame = new Frame();

        this.emitLine('(function (env, context) {');
        this.emitLine('var output = "";');
        this._compileChildren(node, frame);
        this.emitLine('return output;');
        this.emitLine('})');
    },

    compile: function (node, frame) {
        var _compile = this["compile" + node.typename];
        if(_compile) {
            _compile.call(this, node, frame);
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

module.exports = {
    compile: function(src, env) {
        var c = new Compiler(env);
        c.compile(parser.parse(src));
        return c.getCode();
    },

    Compiler: Compiler
};
