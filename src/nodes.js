
var util = require('util');
var _ = require('underscore');
var Object = require('./object');

var Node = Object.extend("Node", {
    init: function(lineno, colno, children) {
        if(children && !_.isArray(children)) {
            throw new Error("Node.init: third argument must be " +
                            "an array (the children)");
        }

        this.children = children || [];
        this.lineno = lineno;
        this.colno = colno;
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

var If = Node.extend("If", {
    init: function(lineno, colno, cond, body, else_) {
        this.cond = cond;
        this.body = body;
        this.else_ = else_;
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

var Output = Node.extend("Output");
var TemplateData = Literal.extend("TemplateData");

function printNodes(node, indent) {
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
    else if(node instanceof If) {
        print("\n");
        printNodes(node.cond, indent+2);
        printNodes(node.body, indent+2);

        if(node.else_) {
            printNodes(node.else_, indent+2);
        }
    }
    else {
        var children = node.children;
        delete node.children;
        print(util.inspect(node, true, null) + "\n", true);
        node.children = children;

        for(var i=0; i<node.numChildren(); i++) {
            printNodes(node.getChild(i), indent+2);
        }
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
    FunCall: FunCall,
    Filter: Filter,

    printNodes: printNodes
};