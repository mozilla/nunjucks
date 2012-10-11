
var util = require('util');
var lib = require('./lib');
var Object = require('./object');

var Node = Object.extend("Node", {
    init: function(lineno, colno) {
        var args = lib.toArray(arguments).slice(2);
        this.lineno = lineno;
        this.colno = colno;

        lib.each(this.fields, function(field, i) {
            var val = args[i];

            // Fields should never be undefined, but null. It makes
            // testing easier to normalize values.
            if(val === undefined) {
                val = null;
            }

            this[field] = val;
        }, this);
    },

    findAll: function(type) {
        var res = [];

        function check(obj) {
            if(obj instanceof type) {
                res.push(obj);
            }

            if(obj instanceof Node) {
                res = res.concat(obj.findAll(type));
            }   
        }

        if(this instanceof NodeList) {
            lib.each(this.children, function(node) {
                check(node);
            }, this);
        }
        else {
            lib.each(this.fields, function(field) {
                var obj = this[field];
                check(obj);
            }, this);
        }

        return res;
    },

    iterFields: function(func) {
        lib.each(this.fields, function(field) {
            func(this[field], field);
        }, this);
    }
});

// Abstract nodes
var Value = Node.extend("Value", { fields: ['value'] });

// Concrete nodes
var NodeList = Node.extend("NodeList", {
    fields: ['children'],

    init: function(lineno, colno, nodes) {
        this.parent(lineno, colno, nodes || []);
    },

    addChild: function(node) {
        this.children.push(node);
    }
});

var Root = NodeList.extend("Root");
var Literal = Value.extend("Literal");
var Symbol = Value.extend("Symbol");
var Group = NodeList.extend("Group");
var Array = NodeList.extend("Array");
var Pair = Node.extend("Pair", { fields: ['key', 'value'] });
var Dict = NodeList.extend("Dict");
var LookupVal = Node.extend("LookupVal", { fields: ['target', 'val'] });
var If = Node.extend("If", { fields: ['cond', 'body', 'else_'] });
var For = Node.extend("For", { fields: ['arr', 'name', 'body'] });
var Macro = Node.extend("Macro", { fields: ['name', 'args', 'body'] });
var Import = Node.extend("Import", { fields: ['template', 'target'] });
var FromImport = Node.extend("FromImport", {
    fields: ['template', 'names'],

    init: function(lineno, colno, template, names) {
        this.parent(lineno, colno,
                    template,
                    names || new NodeList());
    }
});
var FunCall = Node.extend("FunCall", { fields: ['name', 'args'] });
var Filter = FunCall.extend("Filter");
var KeywordArgs = Dict.extend("KeywordArgs");
var Block = Node.extend("Block", { fields: ['name', 'body'] });
var TemplateRef = Node.extend("TemplateRef", { fields: ['template'] });
var Extends = TemplateRef.extend("Extends");
var Include = TemplateRef.extend("Include");
var Set = Node.extend("Set", { fields: ['targets', 'value'] });
var Output = NodeList.extend("Output");
var TemplateData = Literal.extend("TemplateData");
var UnaryOp = Node.extend("UnaryOp", { fields: ['target'] });
var BinOp = Node.extend("BinOp", { fields: ['left', 'right'] });
var Or = BinOp.extend("Or");
var And = BinOp.extend("And");
var Not = UnaryOp.extend("Not");
var Add = BinOp.extend("Add");
var Sub = BinOp.extend("Sub");
var Mul = BinOp.extend("Mul");
var Div = BinOp.extend("Div");
var FloorDiv = BinOp.extend("FloorDiv");
var Mod = BinOp.extend("Mod");
var Pow = BinOp.extend("Pow");
var Neg = UnaryOp.extend("Neg");
var Pos = UnaryOp.extend("Pos");
var Compare = Node.extend("Compare", { fields: ['expr', 'ops'] });
var CompareOperand = Node.extend("CompareOperand", {
    fields: ['expr', 'type']
});

// Print the AST in a nicely formatted tree format for debuggin
function printNodes(node, indent) {
    indent = indent || 0;

    // This is hacky, but this is just a debugging function anyway
    function print(str, indent, inline) {
        var lines = str.split("\n");

        for(var i=0; i<lines.length; i++) {
            if(lines[i]) {
                if((inline && i > 0) || !inline) {
                    for(var j=0; j<indent; j++) {
                        util.print(" ");
                    }
                }
            }

            if(i === lines.length-1) {
                util.print(lines[i]);
            }
            else {
                util.puts(lines[i]);
            }
        }
    }

    print(node.typename + ": ", indent);

    if(node instanceof NodeList) {
        print('\n');
        lib.each(node.children, function(n) {
            printNodes(n, indent + 2);
        });
    }
    else {
        var nodes = null;
        var props = null;

        node.iterFields(function(val, field) {
            if(val instanceof Node) {
                nodes = nodes || {};
                nodes[field] = val;
            }
            else {
                props = props || {};
                props[field] = val;
            }
        });

        if(props) {
            print(util.inspect(props, true, null) + '\n', null, true);
        }
        else {
            print('\n');
        }

        if(nodes) {
            for(var k in nodes) {
                printNodes(nodes[k], indent + 2);
            }
        }
        
    }
}

// var t = new NodeList(0, 0,
//                      [new Value(0, 0, 3),
//                       new Value(0, 0, 10),
//                       new Pair(0, 0,
//                                new Value(0, 0, 'key'),
//                                new Value(0, 0, 'value'))]);
// printNodes(t);

module.exports = {
    Node: Node,
    Root: Root,
    NodeList: NodeList,
    Value: Value,
    Literal: Literal,
    Symbol: Symbol,
    Group: Group,
    Array: Array,
    Pair: Pair,
    Dict: Dict,
    Output: Output,
    TemplateData: TemplateData,
    If: If,
    For: For,
    Macro: Macro,
    Import: Import,
    FromImport: FromImport,
    FunCall: FunCall,
    Filter: Filter,
    KeywordArgs: KeywordArgs,
    Block: Block,
    Extends: Extends,
    Include: Include,
    Set: Set,
    LookupVal: LookupVal,
    BinOp: BinOp,
    Or: Or,
    And: And,
    Not: Not,
    Add: Add,
    Sub: Sub,
    Mul: Mul,
    Div: Div,
    FloorDiv: FloorDiv,
    Mod: Mod,
    Pow: Pow,
    Neg: Neg,
    Pos: Pos,
    Compare: Compare,
    CompareOperand: CompareOperand,

    printNodes: printNodes
};