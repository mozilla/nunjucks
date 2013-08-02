var nodes = require('./nodes');

var sym = 0;
function gensym() {
    return 'hole_' + sym++;
}

// copy-on-write version of map
function mapCOW(arr, func) {
    var res = null;

    for(var i=0; i<arr.length; i++) {
        var item = func(arr[i]);

        if(item !== arr[i]) {
            if(!res) {
                res = arr.slice();
            }

            res[i] = item;
        }
    }

    return res || arr;
}

function walk(ast, func, depthFirst) {
    if(!(ast instanceof nodes.Node)) {
        return ast;
    }

    if(!depthFirst) {
        var astT = func(ast);
        
        if(astT && astT !== ast) {
            return astT;
        }
    }
    
    if(ast instanceof nodes.NodeList) {
        var children = mapCOW(ast.children, function(node) {
            return walk(node, func, depthFirst);
        });

        if(children !== ast.children) {
            ast = new nodes[ast.typename](ast.lineno, ast.colno, children);
        }
    }
    else {
        var props = ast.fields.map(function(field) {
            return ast[field];
        });

        var propsT = mapCOW(props, function(prop) {
            return walk(prop, func, depthFirst);
        });

        if(propsT !== props) {
            ast = new nodes[ast.typename](ast.lineno, ast.colno);

            propsT.forEach(function(prop, i) {
                ast[ast.fields[i]] = prop;
            });
        }
    }

    return depthFirst ? (func(ast) || ast) : ast;
}

function depthWalk(ast, func) {
    return walk(ast, func, true);
}

function liftFilters(ast, asyncFilters) {
    return walk(ast, function(outNode) {
        if(!(outNode instanceof nodes.Output)) {
            return;
        }

        var children = [];

        outNode = depthWalk(outNode, function(node) {
            if(node instanceof nodes.Block) {
                return node;
            }
            else if(node instanceof nodes.Filter &&
                    asyncFilters.indexOf(node.name.value) !== -1) {
                var symbol = new nodes.Symbol(node.lineno,
                                              node.colno,
                                              gensym());

                children.push(new nodes.FilterAsync(node.lineno,
                                                    node.colno,
                                                    node.name, 
                                                    node.args,
                                                    symbol));
                return symbol;
            }
        });

        if(children.length) {
            children.push(outNode);

            return new nodes.NodeList(
                outNode.lineno,
                outNode.colno,
                children
            );
        }
        else {
            return outNode;
        }
    });
}

function liftSuper(ast) {
    return walk(ast, function(blockNode) {
        if(!(blockNode instanceof nodes.Block)) {
            return;
        }

        var hasSuper = false;
        var symbol = gensym();

        blockNode.body = walk(blockNode.body, function(node) {
            if(node instanceof nodes.FunCall &&
               node.name.value == 'super') {
                hasSuper = true;
                return new nodes.Symbol(node.lineno, node.colno, symbol);
            }
        });

        if(hasSuper) {
            blockNode.body.children.unshift(new nodes.Super(
                0, 0, blockNode.name, new nodes.Symbol(0, 0, symbol)
            ));
        }
    });
}

function cps(ast, asyncFilters) {
    return liftSuper(liftFilters(ast, asyncFilters));
}

function transform(ast, asyncFilters, extensions, name) {
    // Run the extension preprocessors against the source.
    if(extensions && extensions.length) {
        for(var i=0; i<extensions.length; i++) {
            if('preprocess' in extensions[i]) {
                src = extensions[i].preprocess(src, name);
            }
        }
    }

    return cps(ast, asyncFilters || []);
}

// var parser = require('./parser');
// var src = '{% for i in [1,2] %}' +
//     '{% include "poop.html" %}' +
//     '{% endfor %}';
// var ast = transform(parser.parse(src));
// nodes.printNodes(ast);

module.exports = {
    transform: transform
};
