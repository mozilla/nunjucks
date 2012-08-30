
var _ = require('underscore');
var parser = require('./parser');
var nodes = require('./nodes');
var Object = require('./object');

// These are all the same for now, but shouldn't be passed straight
// through
var compareOps = {
    '==': '==',
    '!=': '!=',
    '<': '<',
    '>': '>',
    '<=': '<=',
    '>=': '>='
};

// A common pattern is to emit binary operators 
function binOpEmitter(str) {
    return function(node, frame) {
        this.compile(node.left, frame);
        this.emit(str);
        this.compile(node.right, frame);
    };
}

// Frames keep track of scoping at compile-time so we know how to
// access variables. Blocks can introduce special variables, for
// example.
var Frame = Object.extend({
    init: function() {
        this.variables = [];
    },

    addVariable: function(name) {
        this.variables.push(name);
    },

    removeVariable: function(name) {
        this.variables = _.without(this.variables, name);
    },

    findVariable: function(name) {
        return _.indexOf(this.variables, name) !== -1;
    }
});

var Compiler = Object.extend({
    init: function(env) {
        this.codebuf = [];
        this.env = env;
        this.lastId = 0;
        this.buffer = null;
        this.isChild = false;
    },

    emit: function(code) {
        this.codebuf.push(code);
    },

    emitLine: function(code) {
        this.emit(code + "\n");
    },

    emitFuncBegin: function(name) {
        this.buffer = this.tmpid();
        this.emitLine('function ' + name + '(env, context) {');
        this.emitLine('var ' + this.buffer + ' = "";');
    },

    emitFuncEnd: function(noReturn) {
        if(!noReturn) {
            this.emitLine('return ' + this.buffer + ';');
        }

        this.emitLine('}');
        this.buffer = null;
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
                        nodes.Filter,
                        nodes.LookupVal,
                        nodes.Compare);
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

        if(frame.findVariable(name)) {
            this.emit('l_' + name);
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

    compileOr: binOpEmitter(' || '),
    compileAnd: binOpEmitter(' && '),
    compileAdd: binOpEmitter(' + '),
    compileSub: binOpEmitter(' - '),
    compileMul: binOpEmitter(' * '),
    compileDiv: binOpEmitter(' / '),
    compileMod: binOpEmitter(' % '),

    compileNot: function(node, frame) {
        this.emit('!');
        this.compile(node.target, frame);
    },

    compileFloorDiv: function(node, frame) {
        this.emit('Math.floor(');
        this.compile(node.left, frame);
        this.emit(' / ');
        this.compile(node.right, frame);
        this.emit(')');
    },

    compilePow: function(node, frame) {
        this.emit('Math.pow(');
        this.compile(node.left, frame);
        this.emit(', ');
        this.compile(node.right, frame);
        this.emit(')');
    },

    compileNeg: function(node, frame) {
        this.emit('-');
        this.compile(node.target, frame);
    },
    
    compilePos: function(node, frame) {
        this.emit('+');
        this.compile(node.target, frame);
    },

    compileCompare: function(node, frame) {
        this.compile(node.expr, frame);
        
        _.each(node.ops, function(n) {
            this.emit(' ' + compareOps[n.type] + ' ');
            this.compile(n.expr, frame);
        }, this);
    },

    compileLookupVal: function(node, frame) {
        this._compileExpression(node.target, frame);
        this.emit('[');
        this._compileExpression(node.val, frame);
        this.emit(']');
    },

    compileFunCall: function(node, frame) {
        this._compileExpression(node.name, frame);
        this._compileAggregate(node, frame, '(', ')');
    },

    compileFilter: function(node, frame) {
        var name = node.name;
        this.assertType(name, nodes.Symbol);

        this.emit('env.getFilter("' + name.value + '")');
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
        var i = this.tmpid();
        var arr = this.tmpid();

        this.emit('var ' + arr + ' = ');
        this._compileExpression(node.arr, frame);
        this.emitLine(';');

        if(node.name instanceof nodes.Array) {
            // key/value iteration
            var key = node.name.children[0];
            var val = node.name.children[1];
            var k = 'l_' + key.value;
            var v = 'l_' + val.value;

            frame.addVariable(key.value);
            frame.addVariable(val.value);


            this.emitLine('for(var ' + k + ' in ' + arr + ') {');
            this.emitLine('var ' + v + ' = ' + arr + '[' + k + '];');
        }
        else {
            var v = 'l_' + node.name.value;

            frame.addVariable(node.name.value);

            this.emitLine('for(var ' + i + '=0; ' + i + ' < ' + arr + '.length; ' +
                          i + '++) {');
            this.emitLine('var ' + v + ' = ' + arr + '[' + i + '];');

        }

        this.compile(node.body, frame);
        this.emitLine('}');

        frame.removeVariable(v);
    },

    compileBlock: function(node, frame) {
        this.emitLine(this.buffer + ' += context.getBlock("' +
                      node.name.value + '")(env, context);');
    },

    compileExtends: function(node, frame) {
        if(this.isChild) {
            throw new Error('cannot extend multiple times');
        }
        
        this.emit('var parentTemplate = env.getTemplate(');
        this._compileExpression(node.template, frame);
        this.emitLine(', true);');

        var k = this.tmpid();

        this.emitLine('for(var ' + k + ' in parentTemplate.blocks) {');
        this.emitLine('context.addBlock(' + k +
                      ', parentTemplate.blocks[' + k + ']);');
        this.emitLine('}');

        this.isChild = true;
    },

    compileInclude: function(node, frame) {
        this.emit('var includeTemplate = env.getTemplate(');
        this._compileExpression(node.template, frame);
        this.emitLine(')');
        this.emitLine(this.buffer +
                      ' += includeTemplate.render(context.getVariables());');
    },

    compileTemplateData: function(node, frame) {
        this.compileLiteral(node, frame);
    },

    compileOutput: function(node, frame) {
        this.emit(this.buffer + ' += ');
        this._compileChildren(node, frame);
        this.emit(';\n');
    },

    compileRoot: function(node, frame) {
        if(frame) {
            throw new Error("root node can't have frame");
        }

        frame = new Frame();

        this.emitFuncBegin('root');
        this._compileChildren(node, frame);
        if(this.isChild) {
            this.emitLine('return ' +
                          'parentTemplate.rootRenderFunc(env, context);');
        }
        this.emitFuncEnd(this.isChild);

        var blocks = node.findAll(nodes.Block);
        _.each(blocks, function(block) {
            var name = block.name.value;
            this.emitFuncBegin('b_' + name);
            this.emitLine('var l_super = context.getSuper(env, ' + 
                          '"' + name + '", ' +
                          'b_' + name + ');');

            frame.addVariable('super');
            this.compile(block.body, frame);
            frame.removeVariable('super');

            this.emitFuncEnd();
        }, this);

        this.emitLine('return {');
        _.each(blocks, function(block) {
            var name = 'b_' + block.name.value;
            this.emitLine(name + ': ' + name + ',');
        }, this);
        this.emitLine('root: root\n};');
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
// var src = "{% for k, v in tmpl %}{{ k }} ===> {{ v }}{% endfor %}";

// var ns = parser.parse(src);
// nodes.printNodes(ns);
// c.compile(ns);

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
