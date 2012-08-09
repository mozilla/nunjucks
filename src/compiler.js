
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

    compileIf: function(node) {
        this.emit('if(');
        this.compile(node.cond);
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
        this.emitLine('var output = "";');
        this._compileChildren(node);
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

var Context = Object.extend({
    init: function(ctx) {
        this.ctx = ctx;
    },

    lookup: function(name) {
        if(!(name in this.ctx)) {
            throw new Error("'" + name + "' is undefined");
        }
        return this.ctx[name];
    }
});


function render(tmpl, context) {
    context = new Context(context);
    eval(tmpl);
    return output;
}

var fs = require("fs");
var c = new Compiler();
var src = fs.readFileSync("test.html", "utf-8");
c.compile(parser.parse(src));

var tmpl = c.getCode();

console.log(tmpl);

console.log(render(tmpl, { username: "James Long",
                           sick: false,
                           throwing: false,
                           pooping: false }));

module.exports = {
    render: render,
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