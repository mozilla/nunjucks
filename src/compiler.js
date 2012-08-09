
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

    compileNodeList: function(node) {
        var _this = this;
        node.iterChildren(function(n) {
            _this.compile(n);
        });
    },

    compileLiteral: function(node) {
        if(typeof node.value == "string") {
            this.emit('"' + node.value.replace(/"/g, '\\"') + '"');
        }
        else {
            this.emit(node.value.toString());
        }
    },

    compileSymbol: function(node) {
        this.emit(node.value);
    },

    compileTemplateData: function(node) {
        this.compileLiteral(node);
    },

    compileOutput: function(node) {
        var _this = this;
        this.emit('output += ');
        node.iterChildren(function(n) {
            _this.compile(n);
        });
        this.emit(';\n');
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

    compileRoot: function(node) {
        this.compile(node);
        return this.codebuf.join("");
    }
});

var fs = require("fs");
var c = new Compiler();
var src = fs.readFileSync("test.html", "utf-8");
console.log(c.compileRoot(parser.parse(src)));

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