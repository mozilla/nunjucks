'use strict';

var nodes = require('./nodes');
var lib = require('./lib');

var sym = 0;
function gensym() {
  return 'hole_' + sym++;
}

// copy-on-write version of map
function mapCOW(arr, func) {
  var res = null;
  for (let i = 0; i < arr.length; i++) {
    const item = func(arr[i]);

    if (item !== arr[i]) {
      if (!res) {
        res = arr.slice();
      }

      res[i] = item;
    }
  }

  return res || arr;
}

function walk(ast, func, depthFirst) {
  if (!(ast instanceof nodes.Node)) {
    return ast;
  }

  if (!depthFirst) {
    const astT = func(ast);

    if (astT && astT !== ast) {
      return astT;
    }
  }

  if (ast instanceof nodes.NodeList) {
    const children = mapCOW(ast.children, (node) => walk(node, func, depthFirst));

    if (children !== ast.children) {
      ast = new nodes[ast.typename](ast.lineno, ast.colno, children);
    }
  } else if (ast instanceof nodes.CallExtension) {
    const args = walk(ast.args, func, depthFirst);
    const contentArgs = mapCOW(ast.contentArgs, (node) => walk(node, func, depthFirst));

    if (args !== ast.args || contentArgs !== ast.contentArgs) {
      ast = new nodes[ast.typename](ast.extName, ast.prop, args, contentArgs);
    }
  } else {
    const props = ast.fields.map((field) => ast[field]);
    const propsT = mapCOW(props, (prop) => walk(prop, func, depthFirst));

    if (propsT !== props) {
      ast = new nodes[ast.typename](ast.lineno, ast.colno);
      propsT.forEach((prop, i) => {
        ast[ast.fields[i]] = prop;
      });
    }
  }

  return depthFirst ? (func(ast) || ast) : ast;
}

function depthWalk(ast, func) {
  return walk(ast, func, true);
}

function _liftFilters(node, asyncFilters, prop) {
  var children = [];

  var walked = depthWalk(prop ? node[prop] : node, (descNode) => {
    let symbol;
    if (descNode instanceof nodes.Block) {
      return descNode;
    } else if ((descNode instanceof nodes.Filter &&
      lib.indexOf(asyncFilters, descNode.name.value) !== -1) ||
      descNode instanceof nodes.CallExtensionAsync) {
      symbol = new nodes.Symbol(descNode.lineno,
        descNode.colno,
        gensym());

      children.push(new nodes.FilterAsync(descNode.lineno,
        descNode.colno,
        descNode.name,
        descNode.args,
        symbol));
    }
    return symbol;
  });

  if (prop) {
    node[prop] = walked;
  } else {
    node = walked;
  }

  if (children.length) {
    children.push(node);

    return new nodes.NodeList(
      node.lineno,
      node.colno,
      children
    );
  } else {
    return node;
  }
}

function liftFilters(ast, asyncFilters) {
  return depthWalk(ast, (node) => {
    if (node instanceof nodes.Output) {
      return _liftFilters(node, asyncFilters);
    } else if (node instanceof nodes.Set) {
      return _liftFilters(node, asyncFilters, 'value');
    } else if (node instanceof nodes.For) {
      return _liftFilters(node, asyncFilters, 'arr');
    } else if (node instanceof nodes.If) {
      return _liftFilters(node, asyncFilters, 'cond');
    } else if (node instanceof nodes.CallExtension) {
      return _liftFilters(node, asyncFilters, 'args');
    } else {
      return undefined;
    }
  });
}

function liftSuper(ast) {
  return walk(ast, (blockNode) => {
    if (!(blockNode instanceof nodes.Block)) {
      return;
    }

    let hasSuper = false;
    const symbol = gensym();

    blockNode.body = walk(blockNode.body, (node) => { // eslint-disable-line consistent-return
      if (node instanceof nodes.FunCall && node.name.value === 'super') {
        hasSuper = true;
        return new nodes.Symbol(node.lineno, node.colno, symbol);
      }
    });

    if (hasSuper) {
      blockNode.body.children.unshift(new nodes.Super(
        0, 0, blockNode.name, new nodes.Symbol(0, 0, symbol)
      ));
    }
  });
}

function convertStatements(ast) {
  return depthWalk(ast, (node) => {
    if (!(node instanceof nodes.If) && !(node instanceof nodes.For)) {
      return undefined;
    }

    let async = false;
    walk(node, (child) => {
      if (child instanceof nodes.FilterAsync ||
        child instanceof nodes.IfAsync ||
        child instanceof nodes.AsyncEach ||
        child instanceof nodes.AsyncAll ||
        child instanceof nodes.CallExtensionAsync) {
        async = true;
        // Stop iterating by returning the node
        return child;
      }
      return undefined;
    });

    if (async) {
      if (node instanceof nodes.If) {
        return new nodes.IfAsync(
          node.lineno,
          node.colno,
          node.cond,
          node.body,
          node.else_
        );
      } else if (node instanceof nodes.For && !(node instanceof nodes.AsyncAll)) {
        return new nodes.AsyncEach(
          node.lineno,
          node.colno,
          node.arr,
          node.name,
          node.body,
          node.else_
        );
      }
    }
    return undefined;
  });
}

function cps(ast, asyncFilters) {
  return convertStatements(liftSuper(liftFilters(ast, asyncFilters)));
}

function transform(ast, asyncFilters) {
  return cps(ast, asyncFilters || []);
}

// var parser = require('./parser');
// var src = 'hello {% foo %}{% endfoo %} end';
// var ast = transform(parser.parse(src, [new FooExtension()]), ['bar']);
// nodes.printNodes(ast);

module.exports = {
  transform: transform
};
