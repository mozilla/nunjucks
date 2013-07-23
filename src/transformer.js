var nodes = require('./nodes');

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
            ast = new nodes.NodeList(ast.lineno, ast.colno, children);
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

function cps(ast) {
    var sym = 0;
    function gensym() {
        return 'hole_' + sym++;
    }

    return depthWalk(ast, function(node) {
        if(node instanceof nodes.NodeList) {
            var filters = [];

            node = depthWalk(node, function(node) {
                if(node instanceof nodes.Filter) {
                    var symbol = gensym();

                    filters.push(new nodes.FilterAsync(node.lineno,
                                                       node.colno,
                                                       node.name, 
                                                       node.args,
                                                       symbol));
                    return new nodes.Value(node.lineno, node.colno, symbol);
                }
            });

            node.children = filters.map(function(f) {
                return f.node;
            }).concat(node.children);

            return node;
        }
    });
}

function transform(ast, extensions, name) {
    // Run the extension preprocessors against the source.
    if(extensions && extensions.length) {
        for(var i=0; i<extensions.length; i++) {
            if('preprocess' in extensions[i]) {
                src = extensions[i].preprocess(src, name);
            }
        }
    }

    return cps(ast);
}

// var parser = require('./parser');
// var src = 'sdfd {{ foo | poop(1, 2, 3 | bar) }}';
// var ast = transform(parser.parse(src));
// nodes.printNodes(ast);

module.exports = {
    transform: transform
};
