
var util = require('util');
var lib = require('./lib');
var Object = require('./object');

// TODO: Don't use a children array, but rather a single node "body"
var Node = Object.extend("Node", {
    init: function(lineno, colno, children) {
        if(children && !lib.isArray(children)) {
            throw new Error("Node.init: third argument must be " +
                            "an array (the children)");
        }

        this.children = children || [];
        this.lineno = lineno;
        this.colno = colno;
    },

    findAll: function(type) {
        var res = [];

        // TODO: clean this up
        for(var k in this) {
            var obj = this[k];

            if(lib.isArray(obj)) {
                for(var i=0; i<obj.length; i++) {
                    var n = obj[i];

                    if(n instanceof type) {
                        res.push(n);
                    }

                    if(n instanceof Node) {
                        res = res.concat(n.findAll(type));
                    }
                };
            }
            else if(obj instanceof Node) {
                res = res.concat(obj.findAll(type));
            }
        }

        return res;
    },

    addChild: function(node) {
        this.children.push(node);
    },

    getChild: function(i) {
        return this.children[i];
    },

    numChildren: function() {
        return this.children.length;
    },

    iterChildren: function(func) {
        for(var i=0; i<this.children.length; i++) {
            func(this.children[i]);
        }
    }
});

// Abstract nodes
var Expr = Node.extend("Expr");
var Value = Expr.extend("Value", {
    init: function (lineno, colno, value) {
        this.value = value;
        this.parent(lineno, colno);
    }
});

// Concrete nodes
var Root = Node.extend("Root");
var NodeList = Node.extend("NodeList");
var Literal = Value.extend("Literal");
var Symbol = Value.extend("Symbol");

var Group = Expr.extend("Group");
var Array = Expr.extend("Array");
var Pair = Node.extend("Pair", {
    init: function(lineno, colno, key, val) {
        this.parent(lineno, colno, [key, val]);
    },

    getKey: function() {
        return this.children[0];
    },

    getValue: function() {
        return this.children[1];
    }
});
var Dict = Expr.extend("Dict");
var LookupVal = Expr.extend("LookupVal", {
    init: function(lineno, colno, target, val) {
        this.target = target;
        this.val = val;
        this.parent(lineno, colno);
    }
});

var If = Node.extend("If", {
    init: function(lineno, colno, cond, body, else_) {
        this.cond = cond;
        this.body = body;
        this.else_ = else_;
        this.parent(lineno, colno);
    }
});

var For = Node.extend("For", {
    init: function(lineno, colno, arr, name, body) {
        this.arr = arr;
        this.name = name;
        this.body = body;
        this.parent(lineno, colno);
    }
});

var FunCall = Node.extend("FunCall", {
    init: function(lineno, colno, name, args) {
        this.name = name;
        this.parent(lineno, colno, args);
    }
});

var Filter = FunCall.extend("Filter");

var Block = Node.extend("Block", {
    init: function(lineno, colno, name, body) {
        this.name = name;
        this.body = body;
        this.parent(lineno, colno);
    }
});

var TemplateRef = Node.extend("TemplateRef", {
    init: function(lineno, colno, template) {
        this.template = template;
        this.parent(lineno, colno);
    }
});

var Extends = TemplateRef.extend("Extends");
var Include = TemplateRef.extend("Include");
var Set = Node.extend("Set");

var Output = Node.extend("Output");
var TemplateData = Literal.extend("TemplateData");

var UnaryOp = Expr.extend("UnaryOp", {
    init: function(lineno, colno, target) {
        this.target = target;
        this.parent(lineno, colno);
    }
});

var BinOp = Expr.extend("BinOp", { 
    init: function(lineno, colno, left, right) {
        this.left = left;
        this.right = right;
        this.parent(lineno, colno);
    }
});

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

var Compare = Expr.extend("Compare", {
    init: function(lineno, colno, expr, ops) {
        this.expr = expr;
        this.ops = ops;
        this.parent(lineno, colno);
    }
});
var CompareOperand = Expr.extend("CompareOperand", {
    init: function(lineno, colno, expr, type) {
        this.expr = expr;
        this.type = type;
        this.parent(lineno, colno);
    }
});

function printNodes(node, indent) {
    // TODO: spend more then 30 seconds and clean this up 
    indent = indent || 0;

    function print(str, inline) {
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

    print(node.typename + ": ");

    if(node instanceof FunCall) {
        print("\n");
        printNodes(node.name, indent+2);

        node.iterChildren(function(node) {
            printNodes(node, indent+2);
        });
    }
    else if(node instanceof For) {
        print("\n");
        printNodes(node.name, indent+2);
        printNodes(node.arr, indent+2);
        printNodes(node.body, indent+2);
    }
    else if(node instanceof If) {
        print("\n");
        printNodes(node.cond, indent+2);
        printNodes(node.body, indent+2);

        if(node.else_) {
            printNodes(node.else_, indent+2);
        }
    }
    else if(node instanceof Block) {
        print("\n");
        printNodes(node.name, indent+2);
        printNodes(node.body, indent+2);
    }
    else if(node instanceof Set) {
        print("\n");
        for(var i=0; i<node.targets.length; i++) {
            printNodes(node.targets[i], indent+2);
        }
        printNodes(node.value, indent+2);
    }
    else if(node instanceof LookupVal) {
        print("\n");
        printNodes(node.target, indent+2);
        printNodes(node.val, indent+2);
    }
    else if(node instanceof UnaryOp) {
        print("\n");
        printNodes(node.target, indent+2);
    }
    else if(node instanceof BinOp) {
        print("\n");
        printNodes(node.left, indent+2);
        printNodes(node.right, indent+2);
    }
    else if(node instanceof Compare) {
        print("\n");
        printNodes(node.expr, indent+2);

        for(var i=0; i<node.ops.length; i++) {
            printNodes(node.ops[i], indent+2);
        }
    }
    else if(node instanceof CompareOperand) {
        console.log("(" + node.type + ")");
        
        printNodes(node.expr, indent+2);
        
    }
    else {
        var children = node.children;
        delete node.children;
        print(util.inspect(node, true, null) + "\n", true);
        node.children = children;

        node.iterChildren(function(node) {
            printNodes(node, indent+2);
        });
    }
}

module.exports = {
    Node: Node,
    Root: Root,
    NodeList: NodeList,
    Expr: Expr,
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
    FunCall: FunCall,
    Filter: Filter,
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